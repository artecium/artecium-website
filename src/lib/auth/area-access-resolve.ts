import {
  fetchUserRolesFromSupabase,
  resolveIsStaffFromSupabase,
} from "@/lib/auth/profile-roles";
import { hasAnyStaffRole } from "@/lib/auth/permissions";
import { logDataQueryError } from "@/lib/data/supabase-query";
import type { UserAreaAccess } from "@/lib/auth/area-access-policy";

/** Shared resolver for middleware and server (no next/headers). */
export async function resolveUserAreaAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
): Promise<UserAreaAccess> {
  const roles = await fetchUserRolesFromSupabase(supabase, userId);
  const isStaff =
    hasAnyStaffRole(roles) || (await resolveIsStaffFromSupabase(supabase, userId));

  const companyResult = await supabase
    .from("company_users")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const bookingResult = await supabase
    .from("booking_business_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (companyResult.error) {
    logDataQueryError("area-access.resolve.company_users", companyResult.error);
  }
  if (bookingResult.error) {
    logDataQueryError(
      "area-access.resolve.booking_business_members",
      bookingResult.error,
    );
  }

  return {
    userId,
    isStaff,
    hasClientPortal: !isStaff && (companyResult.count ?? 0) > 0,
    hasBookingPortal: (bookingResult.count ?? 0) > 0,
  };
}
