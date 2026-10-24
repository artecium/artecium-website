import type { ReactNode } from "react";

export interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
}

export const clientNavRoutes = [
  { key: "dashboard", href: "/client/dashboard" },
  { key: "projects", href: "/client/projects" },
  { key: "services", href: "/client/services" },
  { key: "analytics", href: "/client/analytics" },
  { key: "seo", href: "/client/seo" },
  { key: "reports", href: "/client/reports" },
  { key: "payments", href: "/client/payments" },
  { key: "invoices", href: "/client/invoices" },
  { key: "documents", href: "/client/documents" },
  { key: "support", href: "/client/support" },
  { key: "notifications", href: "/client/notifications" },
  { key: "meetings", href: "/client/meetings" },
  { key: "feedback", href: "/client/feedback" },
  { key: "profile", href: "/client/profile" },
  { key: "settings", href: "/client/settings" },
] as const;

export function buildClientNavItems(
  t: (key: string) => string,
): NavItem[] {
  return clientNavRoutes.map(({ key, href }) => ({
    label: t(key),
    href,
  }));
}

/** @deprecated Use buildClientNavItems with translations */
export const clientNavItems: NavItem[] = clientNavRoutes.map(({ key, href }) => ({
  label: key.charAt(0).toUpperCase() + key.slice(1),
  href,
}));

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
