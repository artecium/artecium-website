import { PERMISSIONS, type Permission } from "@/types/platform";
import type { NavItem } from "@/config/navigation/platform";

export interface AdminNavItem extends NavItem {
  /** Empty = visible to all staff roles. */
  permissions?: Permission[];
}

export const phase1AdminNavItems: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard" },
  {
    label: "Clientes",
    href: "/admin/clients",
    permissions: [PERMISSIONS.CLIENTS_VIEW],
  },
  {
    label: "Projetos",
    href: "/admin/projects",
    permissions: [PERMISSIONS.PROJECTS_VIEW],
  },
  {
    label: "Serviços",
    href: "/admin/services",
    permissions: [PERMISSIONS.CLIENTS_VIEW],
  },
  {
    label: "Tarefas",
    href: "/admin/tasks",
    permissions: [PERMISSIONS.PROJECTS_VIEW],
  },
  {
    label: "Tickets",
    href: "/admin/tickets",
    permissions: [PERMISSIONS.SUPPORT_VIEW],
  },
  {
    label: "Documentos",
    href: "/admin/documents",
    permissions: [PERMISSIONS.DOCUMENTS_VIEW],
  },
  {
    label: "Relatórios",
    href: "/admin/reports",
    permissions: [PERMISSIONS.REPORTS_VIEW],
  },
  {
    label: "Reuniões",
    href: "/admin/meetings",
    permissions: [PERMISSIONS.CLIENTS_VIEW, PERMISSIONS.PROJECTS_VIEW],
  },
  {
    label: "Pagamentos",
    href: "/admin/payments",
    permissions: [PERMISSIONS.PAYMENTS_VIEW],
  },
  {
    label: "Faturas",
    href: "/admin/invoices",
    permissions: [PERMISSIONS.INVOICES_VIEW],
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    permissions: [PERMISSIONS.ANALYTICS_VIEW],
  },
  {
    label: "SEO",
    href: "/admin/seo",
    permissions: [PERMISSIONS.SEO_VIEW],
  },
  {
    label: "Notificações",
    href: "/admin/notifications",
    permissions: [PERMISSIONS.CLIENTS_VIEW],
  },
  {
    label: "Definições",
    href: "/admin/settings",
    permissions: [PERMISSIONS.SETTINGS_MANAGE],
  },
];

export function filterAdminNavForPermissions(
  permissions: Permission[],
): NavItem[] {
  return phase1AdminNavItems.filter((item) => {
    if (!item.permissions?.length) return true;
    return item.permissions.some((permission) => permissions.includes(permission));
  });
}
