/** Pure area-access rules (safe for client, middleware, and tests). */

export type UserAreaAccess = {
  userId: string;
  isStaff: boolean;
  /** Artecium client portal (company_users). */
  hasClientPortal: boolean;
  /** At least one booking_business_members row. */
  hasBookingPortal: boolean;
};

export function canEnterClientPortal(access: UserAreaAccess): boolean {
  return access.hasClientPortal && !access.isStaff;
}

export function canEnterBookingAdmin(access: UserAreaAccess): boolean {
  return access.hasBookingPortal;
}

/** Booking onboarding: only when user has no client portal and no booking membership yet. */
export function canUseBookingOnboarding(access: UserAreaAccess): boolean {
  if (access.isStaff) return false;
  if (access.hasBookingPortal) return false;
  if (access.hasClientPortal) return false;
  return true;
}

/** Default landing after sign-in when no explicit `next` path is set. */
export function resolvePostLoginPath(access: UserAreaAccess): string {
  if (access.isStaff) return "/admin/dashboard";
  return "/acesso";
}

/** Post-login default on booking.artecium.com (public URL segments). */
export function resolveBookingHostPostLoginPath(access: UserAreaAccess): string {
  if (access.hasBookingPortal) return "/dashboard";
  if (canUseBookingOnboarding(access)) return "/onboarding";
  return "/login";
}

const CLIENT_DASHBOARD = "/client/dashboard";
const BOOKING_ADMIN_DASHBOARD = "/booking/admin/dashboard";

export function loginHref(nextPath: string): string {
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

/** Client area entry from /acesso (auth gate via login when no session). */
export function resolveClientAreaHubHref(
  access: UserAreaAccess | null,
  hasSession: boolean,
): string {
  if (!hasSession) {
    return loginHref(CLIENT_DASHBOARD);
  }
  if (access?.isStaff) {
    return "/admin/dashboard";
  }
  return CLIENT_DASHBOARD;
}

/** Booking entry from /acesso; server layouts enforce membership/onboarding. */
export function resolveBookingAreaHubHref(
  access: UserAreaAccess | null,
  hasSession: boolean,
): string {
  if (!hasSession) {
    return loginHref(BOOKING_ADMIN_DASHBOARD);
  }
  if (access?.hasBookingPortal) {
    return BOOKING_ADMIN_DASHBOARD;
  }
  if (access && canUseBookingOnboarding(access)) {
    return "/booking/admin/onboarding";
  }
  return loginHref(BOOKING_ADMIN_DASHBOARD);
}
