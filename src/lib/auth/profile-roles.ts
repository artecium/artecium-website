import { STAFF_ROLES, USER_ROLES, type UserRole } from "@/types/platform";

const ALL_ROLE_SLUGS = new Set<string>(Object.values(USER_ROLES));

function parseRoleSlug(entry: unknown): string | null {
  if (!entry || typeof entry !== "object") return null;

  const roles = (entry as { roles?: unknown }).roles;
  if (!roles || typeof roles !== "object") return null;

  const slug = (roles as { slug?: unknown }).slug;
  return typeof slug === "string" ? slug : null;
}

function normalizeRoleSlugs(slugs: string[]): UserRole[] {
  const roles = slugs.filter((slug): slug is UserRole =>
    ALL_ROLE_SLUGS.has(slug),
  );

  return roles.length ? roles : [USER_ROLES.CLIENT];
}

export function extractRolesFromProfileRow(data: unknown): UserRole[] {
  if (!data || typeof data !== "object") {
    return [USER_ROLES.CLIENT];
  }

  const userRoles = (data as { user_roles?: unknown }).user_roles;
  if (!Array.isArray(userRoles)) {
    return [USER_ROLES.CLIENT];
  }

  const roles = userRoles
    .map(parseRoleSlug)
    .filter((slug): slug is string => Boolean(slug));

  return normalizeRoleSlugs(roles);
}

/** Fetch role slugs from user_roles (works in browser and server Supabase clients). */
export async function fetchUserRolesFromSupabase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
): Promise<UserRole[]> {
  if (!userId) {
    return [USER_ROLES.CLIENT];
  }

  const { data, error } = (await supabase
    .from("user_roles")
    .select("roles ( slug )")
    .eq("user_id", userId)) as { data: unknown; error: unknown };

  if (!error && Array.isArray(data) && data.length) {
    const slugs = data.map(parseRoleSlug).filter(Boolean);
    if (slugs.length) {
      return extractRolesFromProfileRow({ user_roles: data });
    }
  }

  const { data: rpcSlugs, error: rpcError } = (await supabase.rpc(
    "get_my_role_slugs",
  )) as { data: unknown; error: unknown };

  if (!rpcError && Array.isArray(rpcSlugs) && rpcSlugs.length) {
    return normalizeRoleSlugs(
      rpcSlugs.filter((slug): slug is string => typeof slug === "string"),
    );
  }

  const { data: isStaff, error: staffError } = (await supabase.rpc(
    "is_staff_member",
  )) as { data: unknown; error: unknown };

  if (staffError || !isStaff) {
    return [USER_ROLES.CLIENT];
  }

  const { data: isOwnerAdmin } = (await supabase.rpc("is_owner_or_admin")) as {
    data: unknown;
    error: unknown;
  };

  if (isOwnerAdmin) {
    return [USER_ROLES.OWNER];
  }

  return [USER_ROLES.ADMIN];
}

/** Staff check when role slugs are unavailable (uses SECURITY DEFINER RPC). */
export async function resolveIsStaffFromSupabase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
): Promise<boolean> {
  const roles = await fetchUserRolesFromSupabase(supabase, userId);
  if (roles.some((role) => STAFF_ROLES.includes(role))) {
    return true;
  }

  const { data: isStaff, error } = (await supabase.rpc("is_staff_member")) as {
    data: unknown;
    error: unknown;
  };

  return !error && isStaff === true;
}
