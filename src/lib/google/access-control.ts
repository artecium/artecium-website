import "server-only";

import { AccessDeniedError, assertCompanyAccess } from "@/lib/auth/resource-access";
import type { AuthSession } from "@/lib/auth/session";
import { requireClientAuth, requireStaffAuth } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import type { GoogleIntegrationKind, GoogleOAuthInitiatorContext } from "@/lib/google/config";
import { PERMISSIONS, type Permission } from "@/types/platform";

function permissionForIntegration(integration: GoogleIntegrationKind): Permission {
  return integration === "google_analytics"
    ? PERMISSIONS.ANALYTICS_VIEW
    : PERMISSIONS.SEO_VIEW;
}

export async function assertGoogleOAuthInitiator(
  initiatorContext: GoogleOAuthInitiatorContext,
  integration: GoogleIntegrationKind,
  companyId: string,
  expectedUserId: string,
): Promise<AuthSession> {
  if (initiatorContext === "staff") {
    const session = await requireStaffAuth();
    if (session.user.id !== expectedUserId) {
      throw new AccessDeniedError("Authorization session user mismatch.");
    }
    const permission = permissionForIntegration(integration);
    if (!hasPermission(session.profile.permissions, permission)) {
      throw new AccessDeniedError("Missing permission to manage this integration.");
    }
    await assertCompanyAccess(companyId);
    return session;
  }

  const session = await requireClientAuth();
  if (session.user.id !== expectedUserId) {
    throw new AccessDeniedError("Authorization session user mismatch.");
  }
  if (!session.profile.company_ids.includes(companyId)) {
    throw new AccessDeniedError("Company not associated with this account.");
  }

  return session;
}

export async function requireStaffForGoogleStart(
  integration: GoogleIntegrationKind,
  companyId: string,
): Promise<AuthSession> {
  const session = await requireStaffAuth();
  const permission = permissionForIntegration(integration);
  if (!hasPermission(session.profile.permissions, permission)) {
    throw new AccessDeniedError("Missing permission to manage this integration.");
  }
  await assertCompanyAccess(companyId);
  return session;
}
