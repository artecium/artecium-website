import { BOOKING_BUSINESS_COOKIE } from "@/lib/booking/constants";
import {
  isBookingManageMemberRole,
  normalizeBookingMemberRole,
} from "@/lib/booking/member-role";
import type { BookingMemberRole } from "@/types/booking";
import { logDataQueryError } from "@/lib/data/supabase-query";
import { createClient } from "@/lib/supabase/server";
import { sanitizeBookingLoginNext } from "@/lib/auth/booking-login-redirect";
import { readBookingAreaHrefContext, resolveBookingAreaHref } from "@/lib/routing";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

async function redirectBookingAdmin(internalPath: string): Promise<never> {
  const requestHeaders = await headers();
  const ctx = readBookingAreaHrefContext((name) => requestHeaders.get(name));
  redirect(resolveBookingAreaHref(internalPath, ctx));
}

export interface BookingMembership {
  business_id: string;
  role: BookingMemberRole;
  slug: string;
  name: string;
}

export interface BookingSession {
  userId: string;
  email: string;
  memberships: BookingMembership[];
  activeBusinessId: string | null;
  canManageActiveBusiness: boolean;
  /** True when membership query failed (distinct from user having no businesses). */
  membershipsLoadFailed: boolean;
}

async function loadMemberships(
  userId: string,
): Promise<{ memberships: BookingMembership[]; failed: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("booking_business_members")
    .select(
      `
      business_id,
      role,
      booking_businesses ( slug, name )
    `,
    )
    .eq("user_id", userId);

  if (error) {
    logDataQueryError("booking-session.loadMemberships", error);
    return { memberships: [], failed: true };
  }

  const memberships = (data ?? []).map((row) => {
    const business = row.booking_businesses as
      | { slug: string; name: string }
      | { slug: string; name: string }[]
      | null;
    const b = Array.isArray(business) ? business[0] : business;
    return {
      business_id: row.business_id as string,
      role: normalizeBookingMemberRole(String(row.role)),
      slug: b?.slug ?? "",
      name: b?.name ?? "",
    };
  });
  return { memberships, failed: false };
}

export async function getBookingSession(): Promise<BookingSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { memberships, failed: membershipsLoadFailed } = await loadMemberships(user.id);
  const cookieStore = await cookies();
  const cookieBusinessId = cookieStore.get(BOOKING_BUSINESS_COOKIE)?.value ?? null;
  const activeBusinessId =
    memberships.find((m) => m.business_id === cookieBusinessId)?.business_id ??
    memberships[0]?.business_id ??
    null;
  const activeMembership = memberships.find((m) => m.business_id === activeBusinessId);
  const canManageActiveBusiness = activeMembership
    ? isBookingManageMemberRole(activeMembership.role)
    : false;

  return {
    userId: user.id,
    email: user.email ?? "",
    memberships,
    activeBusinessId,
    canManageActiveBusiness,
    membershipsLoadFailed,
  };
}

export async function requireBookingSession(options?: {
  requireBusiness?: boolean;
  requireManage?: boolean;
}): Promise<BookingSession> {
  const session = await getBookingSession();
  if (!session) {
    const requestHeaders = await headers();
    const pathname = requestHeaders.get("x-pathname") ?? "/booking/admin/dashboard";
    const next = sanitizeBookingLoginNext(pathname);
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  if (session.membershipsLoadFailed) {
    throw new Error("Could not load booking memberships. Please try again.");
  }
  if (options?.requireBusiness && !session.activeBusinessId) {
    await redirectBookingAdmin("/booking/admin/onboarding");
  }
  if (options?.requireManage && !session.canManageActiveBusiness) {
    await redirectBookingAdmin("/booking/admin/dashboard");
  }
  return session;
}
