import {
  fetchUserRolesFromSupabase,
  resolveIsStaffFromSupabase,
} from "@/lib/auth/profile-roles";
import { hasAnyStaffRole, resolvePermissions } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/platform";

export function getPostLoginPath(roles: UserRole[]): string {
  if (hasAnyStaffRole(roles)) {
    return "/admin/dashboard";
  }
  return "/client/dashboard";
}

/** Resolve post-login redirect path from Supabase profile roles (client-side). */
export async function resolveClientPostLoginRedirect(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "/login";

  const roles = await fetchUserRolesFromSupabase(supabase, user.id);

  resolvePermissions(roles);

  if (hasAnyStaffRole(roles)) {
    return getPostLoginPath(roles);
  }

  const isStaff = await resolveIsStaffFromSupabase(supabase, user.id);
  return isStaff ? "/admin/dashboard" : "/client/dashboard";
}
