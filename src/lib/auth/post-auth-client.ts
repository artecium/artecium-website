import {
  fetchUserRolesFromSupabase,
  resolveIsStaffFromSupabase,
} from "@/lib/auth/profile-roles";
import {
  resolveBookingHostPostLoginPath,
  resolvePostLoginPath,
  type UserAreaAccess,
} from "@/lib/auth/area-access-policy";
import {
  resolveSafePostAuthPath,
  sanitizeBookingHostLoginNext,
  sanitizeLoginNext,
} from "@/lib/auth/login-redirect";
import { clientAreaLinkTarget, isBookingHostname } from "@/lib/routing";
import { hasAnyStaffRole } from "@/lib/auth/permissions";
import type { SupabaseClient } from "@supabase/supabase-js";

type ClientAppRouter = {
  push: (href: string) => void;
  refresh: () => void;
};

function navigateToSafePath(router: ClientAppRouter, path: string): void {
  if (typeof window !== "undefined" && path.startsWith("/client/")) {
    const target = clientAreaLinkTarget(path, window.location.hostname);
    if (target.useFullNavigation) {
      window.location.assign(target.href);
      return;
    }
    router.push(target.href);
    router.refresh();
    return;
  }

  router.push(path);
  router.refresh();
}

async function buildUserAreaAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserAreaAccess> {
  const roles = await fetchUserRolesFromSupabase(supabase, userId);
  const isStaff =
    hasAnyStaffRole(roles) ||
    (await resolveIsStaffFromSupabase(supabase, userId));

  const [{ count: companyCount }, { count: bookingCount }] = await Promise.all([
    supabase
      .from("company_users")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("booking_business_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  return {
    userId,
    isStaff,
    hasClientPortal: !isStaff && (companyCount ?? 0) > 0,
    hasBookingPortal: (bookingCount ?? 0) > 0,
  };
}

/** After sign-in on /login (client mode). Preserves explicit `next` when safe. */
export async function redirectAfterClientSignIn(
  supabase: SupabaseClient,
  router: ClientAppRouter,
  redirectTo?: string,
): Promise<void> {
  const onBookingHost =
    typeof window !== "undefined" && isBookingHostname(window.location.hostname);

  const safeNext = redirectTo
    ? onBookingHost
      ? sanitizeBookingHostLoginNext(redirectTo) ?? sanitizeLoginNext(redirectTo)
      : sanitizeLoginNext(redirectTo)
    : null;
  if (safeNext) {
    navigateToSafePath(router, safeNext);
    return;
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? "";
  const access = await buildUserAreaAccess(supabase, userId);

  router.push(
    onBookingHost ? resolveBookingHostPostLoginPath(access) : resolvePostLoginPath(access),
  );
  router.refresh();
}

/** After sign-up when a session exists (e.g. email confirm off). */
export async function redirectAfterSignUpSession(
  router: ClientAppRouter,
  redirectTo?: string,
): Promise<void> {
  router.push(resolveSafePostAuthPath(redirectTo));
  router.refresh();
}
