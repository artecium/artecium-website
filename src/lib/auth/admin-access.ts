import { hasPermission } from "@/lib/auth/permissions";
import type { AuthSession } from "@/lib/auth/session";
import { requireStaffAuth, requirePermission } from "@/lib/auth/session";
import type { Permission } from "@/types/platform";
import { redirect } from "next/navigation";

export async function requireAdminPage(
  permission?: Permission,
): Promise<AuthSession> {
  const session = await requireStaffAuth();
  if (permission) {
    requirePermission(session, permission);
  }
  return session;
}

export function canAccess(session: AuthSession, permission: Permission): boolean {
  return hasPermission(session.profile.permissions, permission);
}

export function assertAccess(session: AuthSession, permission: Permission): void {
  if (!canAccess(session, permission)) {
    redirect("/admin/dashboard?error=unauthorized");
  }
}
