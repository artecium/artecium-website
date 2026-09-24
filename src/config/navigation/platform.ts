import type { ReactNode } from "react";

export interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
}

export const clientNavItems: NavItem[] = [
  { label: "Dashboard", href: "/client/dashboard" },
  { label: "Projects", href: "/client/projects" },
  { label: "Services", href: "/client/services" },
  { label: "Analytics", href: "/client/analytics" },
  { label: "SEO", href: "/client/seo" },
  { label: "Reports", href: "/client/reports" },
  { label: "Payments", href: "/client/payments" },
  { label: "Invoices", href: "/client/invoices" },
  { label: "Documents", href: "/client/documents" },
  { label: "Support", href: "/client/support" },
  { label: "Notifications", href: "/client/notifications" },
  { label: "Meetings", href: "/client/meetings" },
  { label: "Feedback", href: "/client/feedback" },
  { label: "Profile", href: "/client/profile" },
  { label: "Settings", href: "/client/settings" },
];

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
