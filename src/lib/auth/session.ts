import { hasAnyStaffRole, resolvePermissions } from "@/lib/auth/permissions";
import {
  fetchUserRolesFromSupabase,
  resolveIsStaffFromSupabase,
} from "@/lib/auth/profile-roles";
import { logDataQueryError } from "@/lib/data/supabase-query";
import { createClient } from "@/lib/supabase/server";
import {
  type Permission,
  type PlatformProfile,
  type UserRole,
} from "@/types/platform";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

interface ProfileBaseRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  locale: string | null;
  currency: string | null;
}

async function fetchCompanyIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", userId);

  if (error) {
    logDataQueryError("session.fetchCompanyIds", error);
    return [];
  }

  return data?.map((entry) => entry.company_id).filter(Boolean) ?? [];
}

async function fetchUserRoles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<UserRole[]> {
  return fetchUserRolesFromSupabase(supabase, userId);
}

function buildFallbackProfile(user: User, companyIds: string[], roles: UserRole[]): PlatformProfile {
  return {
    id: user.id,
    email: user.email ?? "",
    full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
    avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
    locale: "en",
    currency: "EUR",
    roles,
    permissions: resolvePermissions(roles),
    company_ids: companyIds,
  };
}

async function fetchProfile(user: User): Promise<PlatformProfile | null> {
  const supabase = await createClient();

  const [companyIds, roles, profileResult] = await Promise.all([
    fetchCompanyIds(supabase, user.id),
    fetchUserRoles(supabase, user.id),
    supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, locale, currency")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const { data, error } = profileResult;

  if (error) {
    logDataQueryError("session.fetchProfile", error);
  }

  if (error || !data) {
    return buildFallbackProfile(user, companyIds, roles);
  }

  const row = data as ProfileBaseRow;

  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
    locale: (row.locale as PlatformProfile["locale"]) ?? "en",
    currency: (row.currency as PlatformProfile["currency"]) ?? "EUR",
    roles,
    permissions: resolvePermissions(roles),
    company_ids: companyIds,
  };
}

export interface AuthSession {
  user: User;
  profile: PlatformProfile;
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[auth:session.getAuthSession.getUser] ${error.message}`);
    }
    return null;
  }

  const user = data?.user ?? null;
  if (!user) return null;

  const profile = await fetchProfile(user);
  if (!profile) return null;

  return { user, profile };
}

export async function requireAuth(redirectTo = "/login"): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) redirect(redirectTo);
  return session;
}

export async function requireClientAuth(): Promise<AuthSession> {
  const session = await requireAuth("/login");

  if (hasAnyStaffRole(session.profile.roles)) {
    redirect("/admin/dashboard");
  }

  const supabase = await createClient();
  if (await resolveIsStaffFromSupabase(supabase, session.user.id)) {
    redirect("/admin/dashboard");
  }

  return session;
}

export async function requireStaffAuth(): Promise<AuthSession> {
  const session = await requireAuth("/admin/login");

  if (hasAnyStaffRole(session.profile.roles)) {
    return session;
  }

  const supabase = await createClient();
  if (await resolveIsStaffFromSupabase(supabase, session.user.id)) {
    return session;
  }

  redirect("/client/dashboard");
}

export function requirePermission(
  session: AuthSession,
  permission: Permission,
): void {
  if (!session.profile.permissions.includes(permission)) {
    redirect("/admin/dashboard?error=unauthorized");
  }
}
