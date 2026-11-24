import {
  fetchUserRolesFromSupabase,
  resolveIsStaffFromSupabase,
} from "@/lib/auth/profile-roles";
import { hasAnyStaffRole, resolvePermissions } from "@/lib/auth/permissions";
import { postLoginRedirectUrl } from "@/lib/routing";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/platform";

export function getPostLoginPath(roles: UserRole[]): string {
  if (hasAnyStaffRole(roles)) {
    return "/admin/dashboard";
  }
  return "/client/dashboard";
}

function readBrowserHostname(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return window.location.hostname;
}

/** Resolve post-login redirect URL from Supabase profile roles (client-side). */
export async function resolveClientPostLoginRedirect(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "/login";

  const roles = await fetchUserRolesFromSupabase(supabase, user.id);

  resolvePermissions(roles);

  const hostname = readBrowserHostname();

  if (hasAnyStaffRole(roles)) {
    return postLoginRedirectUrl("/admin/dashboard", hostname);
  }

  const isStaff = await resolveIsStaffFromSupabase(supabase, user.id);
  if (isStaff) {
    return postLoginRedirectUrl("/admin/dashboard", hostname);
  }

  return postLoginRedirectUrl("/client/dashboard", hostname);
}
