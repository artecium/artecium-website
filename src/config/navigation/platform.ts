import type { ClientNavIconId } from "@/components/platform/client-nav-icons";
import type { ReactNode } from "react";
import { CLIENT_BOOKING_BASE } from "@/config/navigation/booking";
import { clientAreaHref } from "@/lib/routing";

export interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
  /** Client sidebar icon (ignored for flat admin/booking nav). */
  iconId?: ClientNavIconId;
  /** Optional badge count (client nav only). */
  badge?: number;
  /** Internal App Router path for active-state matching across hosts */
  matchHref?: string;
}

export const clientNavRoutes = [
  { key: "dashboard", internalHref: "/client/dashboard" },
  { key: "projects", internalHref: "/client/projects" },
  { key: "services", internalHref: "/client/services" },
  { key: "analytics", internalHref: "/client/analytics" },
  { key: "seo", internalHref: "/client/seo" },
  { key: "reports", internalHref: "/client/reports" },
  { key: "payments", internalHref: "/client/payments" },
  { key: "invoices", internalHref: "/client/invoices" },
  { key: "documents", internalHref: "/client/documents" },
  { key: "support", internalHref: "/client/support" },
  { key: "notifications", internalHref: "/client/notifications" },
  { key: "meetings", internalHref: "/client/meetings" },
  { key: "feedback", internalHref: "/client/feedback" },
  { key: "profile", internalHref: "/client/profile" },
  { key: "settings", internalHref: "/client/settings" },
] as const;

/** Client sidebar: direct link or expandable group (Back Office uses flat `NavItem[]`). */
export type ClientNavEntry =
  | { kind: "link"; item: NavItem }
  | {
      kind: "group";
      id: string;
      title: string;
      groupIconId: ClientNavIconId;
      items: NavItem[];
    };

function buildClientNavLink(
  labelKey: string,
  internalHref: string,
  iconId: ClientNavIconId,
  t: (key: string) => string,
  hostname: string,
  badge?: number,
): NavItem {
  return {
    label: t(`clientNav.${labelKey}`),
    href: clientAreaHref(internalHref, hostname),
    matchHref: internalHref,
    iconId,
    ...(badge !== undefined && badge > 0 ? { badge } : {}),
  };
}

type ClientNavLinkDef = {
  labelKey: string;
  internalHref: string;
  iconId: ClientNavIconId;
};

const clientNavSectionDefs = [
  {
    kind: "link" as const,
    labelKey: "overview",
    internalHref: "/client/dashboard",
    iconId: "overview" as const,
  },
  {
    kind: "link" as const,
    labelKey: "myProjects",
    internalHref: "/client/projects",
    iconId: "projects" as const,
  },
  {
    kind: "link" as const,
    labelKey: "myServices",
    internalHref: "/client/services",
    iconId: "services" as const,
  },
  {
    kind: "group" as const,
    id: "analytics-seo",
    titleKey: "groupAnalyticsSeo",
    iconId: "analyticsSeo" as const,
    items: [
      { labelKey: "analytics", internalHref: "/client/analytics", iconId: "analytics" },
      { labelKey: "seo", internalHref: "/client/seo", iconId: "seo" },
      { labelKey: "reports", internalHref: "/client/reports", iconId: "reports" },
    ] satisfies ClientNavLinkDef[],
  },
  {
    kind: "link" as const,
    labelKey: "meetings",
    internalHref: "/client/meetings",
    iconId: "meetings" as const,
  },
  {
    kind: "group" as const,
    id: "booking",
    titleKey: "groupBooking",
    iconId: "services" as const,
    items: [
      { labelKey: "bookingOverview", internalHref: `${CLIENT_BOOKING_BASE}/dashboard`, iconId: "overview" },
      { labelKey: "bookingCalendar", internalHref: `${CLIENT_BOOKING_BASE}/calendar`, iconId: "meetings" },
      { labelKey: "bookingAppointments", internalHref: `${CLIENT_BOOKING_BASE}/appointments`, iconId: "meetings" },
      { labelKey: "bookingServices", internalHref: `${CLIENT_BOOKING_BASE}/services`, iconId: "services" },
      { labelKey: "bookingStaff", internalHref: `${CLIENT_BOOKING_BASE}/staff`, iconId: "profile" },
      { labelKey: "bookingSchedules", internalHref: `${CLIENT_BOOKING_BASE}/schedules`, iconId: "services" },
      { labelKey: "bookingTimeOff", internalHref: `${CLIENT_BOOKING_BASE}/time-off`, iconId: "meetings" },
      { labelKey: "bookingCustomers", internalHref: `${CLIENT_BOOKING_BASE}/customers`, iconId: "support" },
      { labelKey: "bookingTeam", internalHref: `${CLIENT_BOOKING_BASE}/team`, iconId: "profile" },
      { labelKey: "bookingSettings", internalHref: `${CLIENT_BOOKING_BASE}/settings`, iconId: "settings" },
    ] satisfies ClientNavLinkDef[],
  },
  {
    kind: "link" as const,
    labelKey: "feedback",
    internalHref: "/client/feedback",
    iconId: "feedback" as const,
  },
  {
    kind: "link" as const,
    labelKey: "supportTickets",
    internalHref: "/client/support",
    iconId: "support" as const,
  },
  {
    kind: "group" as const,
    id: "financial",
    titleKey: "groupFinancial",
    iconId: "financial" as const,
    items: [
      { labelKey: "invoices", internalHref: "/client/invoices", iconId: "invoices" },
      { labelKey: "payments", internalHref: "/client/payments", iconId: "payments" },
    ] satisfies ClientNavLinkDef[],
  },
  {
    kind: "link" as const,
    labelKey: "myDocuments",
    internalHref: "/client/documents",
    iconId: "documents" as const,
  },
  {
    kind: "link" as const,
    labelKey: "notifications",
    internalHref: "/client/notifications",
    iconId: "notifications" as const,
  },
  {
    kind: "group" as const,
    id: "account",
    titleKey: "groupAccount",
    iconId: "account" as const,
    items: [
      { labelKey: "profile", internalHref: "/client/profile", iconId: "profile" },
      { labelKey: "settings", internalHref: "/client/settings", iconId: "settings" },
    ] satisfies ClientNavLinkDef[],
  },
];

export type ClientNavBadgeCounts = Partial<
  Record<"support" | "notifications" | "invoices", number>
>;

export type BuildClientNavOptions = {
  includeBooking?: boolean;
};

export function buildClientNavSections(
  t: (key: string) => string,
  hostname = "",
  badges: ClientNavBadgeCounts = {},
  options: BuildClientNavOptions = {},
): ClientNavEntry[] {
  return clientNavSectionDefs
    .filter((def) => def.kind !== "group" || def.id !== "booking" || options.includeBooking === true)
    .map((def) => {
    if (def.kind === "link") {
      const badge =
        def.iconId === "support"
          ? badges.support
          : def.iconId === "notifications"
            ? badges.notifications
            : undefined;
      return {
        kind: "link",
        item: buildClientNavLink(
          def.labelKey,
          def.internalHref,
          def.iconId,
          t,
          hostname,
          badge,
        ),
      };
    }
    return {
      kind: "group",
      id: def.id,
      title: t(`clientNav.${def.titleKey}`),
      groupIconId: def.iconId,
      items: def.items.map(({ labelKey, internalHref, iconId }) =>
        buildClientNavLink(
          labelKey,
          internalHref,
          iconId,
          t,
          hostname,
          iconId === "invoices" ? badges.invoices : undefined,
        ),
      ),
    };
  });
}

export function buildClientNavItems(
  t: (key: string) => string,
  hostname = "",
): NavItem[] {
  return buildClientNavSections(t, hostname).flatMap((entry) =>
    entry.kind === "link" ? [entry.item] : entry.items,
  );
}

/** @deprecated Use buildClientNavItems with translations */
export const clientNavItems: NavItem[] = clientNavRoutes.map(
  ({ key, internalHref }) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    href: internalHref,
    matchHref: internalHref,
  }),
);

export const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Leads", href: "/admin/leads" },
  { label: "Clients", href: "/admin/clients" },
  { label: "Companies", href: "/admin/companies" },
  { label: "Projects", href: "/admin/projects" },
  { label: "Tasks", href: "/admin/tasks" },
  { label: "Team", href: "/admin/team" },
  { label: "Services", href: "/admin/services" },
  { label: "Plans", href: "/admin/plans" },
  { label: "Proposals", href: "/admin/proposals" },
  { label: "Contracts", href: "/admin/contracts" },
  { label: "Approvals", href: "/admin/approvals" },
  { label: "Change Requests", href: "/admin/change-requests" },
  { label: "Deliverables", href: "/admin/deliverables" },
  { label: "Support", href: "/admin/support" },
  { label: "Invoices", href: "/admin/invoices" },
  { label: "Payments", href: "/admin/payments" },
  { label: "Subscriptions", href: "/admin/subscriptions" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "SEO", href: "/admin/seo" },
  { label: "Reports", href: "/admin/reports" },
  { label: "Documents", href: "/admin/documents" },
  { label: "Domains", href: "/admin/domains" },
  { label: "Hosting", href: "/admin/hosting" },
  { label: "SSL", href: "/admin/ssl" },
  { label: "Meetings", href: "/admin/meetings" },
  { label: "Feedback", href: "/admin/feedback" },
  { label: "Notifications", href: "/admin/notifications" },
  { label: "Activity", href: "/admin/activity" },
  { label: "Integrations", href: "/admin/integrations" },
  { label: "Partners", href: "/admin/partners" },
  { label: "Referrals", href: "/admin/referrals" },
  { label: "Users", href: "/admin/users" },
  { label: "Roles", href: "/admin/roles" },
  { label: "Settings", href: "/admin/settings" },
];
