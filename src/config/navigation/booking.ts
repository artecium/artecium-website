import type { NavItem } from "@/config/navigation/platform";
import { bookingAreaHref } from "@/lib/routing";

export const bookingNavRoutes = [
  { key: "dashboard", internalHref: "/booking/admin/dashboard" },
  { key: "calendar", internalHref: "/booking/admin/calendar" },
  { key: "appointments", internalHref: "/booking/admin/appointments" },
  { key: "services", internalHref: "/booking/admin/services" },
  { key: "staff", internalHref: "/booking/admin/staff" },
  { key: "schedules", internalHref: "/booking/admin/schedules" },
  { key: "timeOff", internalHref: "/booking/admin/time-off" },
  { key: "customers", internalHref: "/booking/admin/customers" },
  { key: "team", internalHref: "/booking/admin/team" },
  { key: "settings", internalHref: "/booking/admin/settings" },
] as const;

export const BOOKING_ADMIN_BASE = "/booking/admin";
export const CLIENT_BOOKING_BASE = "/client/booking";

/** Client portal booking nav (parity with dedicated booking admin host). */
export const clientPortalBookingNavKeys = [
  "dashboard",
  "calendar",
  "appointments",
  "services",
  "staff",
  "schedules",
  "timeOff",
  "customers",
  "team",
  "settings",
] as const;

export function buildBookingNavItems(
  t: (key: string) => string,
  hostname = "",
  options?: {
    adminBase?: string;
    keys?: readonly string[];
    requestPathname?: string;
  },
): NavItem[] {
  const adminBase = options?.adminBase ?? BOOKING_ADMIN_BASE;
  const keyFilter = options?.keys ? new Set(options.keys) : null;

  return bookingNavRoutes
    .filter(({ key }) => !keyFilter || keyFilter.has(key))
    .map(({ key, internalHref }) => {
      const suffix = internalHref.slice(BOOKING_ADMIN_BASE.length);
      const internalPath = `${adminBase}${suffix}`;
      const href =
        adminBase === CLIENT_BOOKING_BASE
          ? internalPath
          : bookingAreaHref(internalHref, hostname, options?.requestPathname);

      return {
        label: t(key),
        href,
        matchHref: internalPath,
      };
    });
}
