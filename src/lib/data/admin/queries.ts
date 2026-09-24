import {
  type DataFetchResult,
  fromQueryResult,
  logDataQueryError,
} from "@/lib/data/supabase-query";
import { createClient } from "@/lib/supabase/server";
import type { PostgrestError } from "@supabase/supabase-js";

export interface AdminDashboardStats {
  clients: number;
  activeProjects: number;
  completedProjects: number;
  openTickets: number;
  pendingTasks: number;
  succeededPayments: number;
  pendingInvoices: number;
  upcomingMeetings: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
}

export interface AdminCompanyRow {
  id: string;
  name: string;
  tax_id: string | null;
  website: string | null;
  created_at: string;
  project_count: number;
  subscription_count: number;
}

export interface AdminProjectRow {
  id: string;
  name: string;
  company_id: string;
  company_name: string | null;
  progress: number;
  status_label: string | null;
  due_date: string | null;
  owner_name: string | null;
  task_count: number;
}

export interface AdminTaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  project_id: string;
  project_name: string | null;
  company_name: string | null;
  assignee_name: string | null;
}

export interface AdminTicketRow {
  id: string;
  subject: string;
  status: string;
  priority: string;
  company_id: string;
  company_name: string | null;
  project_name: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface AdminSubscriptionRow {
  id: string;
  company_id: string;
  company_name: string | null;
  service_name: string | null;
  plan_name: string | null;
  status: string;
  price: number | null;
  currency: string;
  billing_period: string;
  started_at: string;
  current_period_end: string | null;
}

function extractName(
  rel: { name?: string; full_name?: string } | { name?: string; full_name?: string }[] | null,
  field: "name" | "full_name" = "name",
): string | null {
  const row = Array.isArray(rel) ? rel[0] : rel;
  if (!row) return null;
  return (row[field] as string | undefined) ?? null;
}

export async function getAdminDashboardStats(): Promise<DataFetchResult<AdminDashboardStats>> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [
    companies,
    projects,
    tickets,
    tasks,
    payments,
    invoices,
    meetings,
    subscriptions,
  ] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase
      .from("projects")
      .select("id, progress, project_statuses(slug)")
      .is("deleted_at", null),
    supabase.from("tickets").select("id, status"),
    supabase.from("tasks").select("id, status"),
    supabase.from("payments").select("id, status"),
    supabase.from("invoices").select("id, status"),
    supabase.from("meetings").select("id").gte("starts_at", now),
    supabase
      .from("client_subscriptions")
      .select("price, billing_period")
      .in("status", ["trialing", "active", "past_due"]),
  ]);

  const firstError =
    companies.error ??
    projects.error ??
    tickets.error ??
    tasks.error ??
    payments.error ??
    invoices.error ??
    meetings.error ??
    subscriptions.error;

  if (firstError) {
    return fromQueryResult("admin.getAdminDashboardStats", null, firstError, {
      clients: 0,
      activeProjects: 0,
      completedProjects: 0,
      openTickets: 0,
      pendingTasks: 0,
      succeededPayments: 0,
      pendingInvoices: 0,
      upcomingMeetings: 0,
      activeSubscriptions: 0,
      monthlyRecurringRevenue: 0,
    });
  }

  const projectRows = projects.data ?? [];
  const completedProjects = projectRows.filter((p) => {
    const status = p.project_statuses as { slug?: string } | { slug?: string }[] | null;
    const slug = Array.isArray(status) ? status[0]?.slug : status?.slug;
    return slug === "completed" || Number(p.progress) >= 100;
  }).length;

  const openTickets = (tickets.data ?? []).filter((t) =>
    !["resolved", "closed"].includes(t.status as string),
  ).length;

  const pendingTasks = (tasks.data ?? []).filter(
    (t) => !["done", "completed", "cancelled"].includes(t.status as string),
  ).length;

  const succeededPayments = (payments.data ?? []).filter(
    (p) => p.status === "succeeded",
  ).length;

  const pendingInvoices = (invoices.data ?? []).filter((i) =>
    ["issued", "sent", "overdue", "partially_paid"].includes(i.status as string),
  ).length;

  const mrr = (subscriptions.data ?? []).reduce((sum, sub) => {
    if (sub.billing_period !== "monthly" || sub.price === null) return sum;
    return sum + Number(sub.price);
  }, 0);

  return fromQueryResult(
    "admin.getAdminDashboardStats",
    {
      clients: companies.count ?? 0,
      activeProjects: projectRows.length - completedProjects,
      completedProjects,
      openTickets,
      pendingTasks,
      succeededPayments,
      pendingInvoices,
      upcomingMeetings: meetings.data?.length ?? 0,
      activeSubscriptions: subscriptions.data?.length ?? 0,
      monthlyRecurringRevenue: mrr,
    },
    null,
    {
      clients: 0,
      activeProjects: 0,
      completedProjects: 0,
      openTickets: 0,
      pendingTasks: 0,
      succeededPayments: 0,
      pendingInvoices: 0,
      upcomingMeetings: 0,
      activeSubscriptions: 0,
      monthlyRecurringRevenue: 0,
    },
  );
}

export async function getAdminCompanies(
  search?: string,
): Promise<DataFetchResult<AdminCompanyRow[]>> {
  const supabase = await createClient();
  let query = supabase
    .from("companies")
    .select("id, name, tax_id, website, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (search?.trim()) {
    query = query.or(
      `name.ilike.%${search.trim()}%,tax_id.ilike.%${search.trim()}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    return fromQueryResult("admin.getAdminCompanies", null, error, []);
  }

  const companyIds = (data ?? []).map((c) => c.id as string);
  const projectCounts = new Map<string, number>();
  const subCounts = new Map<string, number>();

  if (companyIds.length) {
    const [{ data: projects }, { data: subs }] = await Promise.all([
      supabase.from("projects").select("company_id").in("company_id", companyIds).is("deleted_at", null),
      supabase
        .from("client_subscriptions")
        .select("company_id")
        .in("company_id", companyIds)
        .in("status", ["trialing", "active", "past_due"]),
    ]);

    for (const p of projects ?? []) {
      const id = p.company_id as string;
      projectCounts.set(id, (projectCounts.get(id) ?? 0) + 1);
    }
    for (const s of subs ?? []) {
      const id = s.company_id as string;
      subCounts.set(id, (subCounts.get(id) ?? 0) + 1);
    }
  }

  const rows = (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    tax_id: (row.tax_id as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    created_at: row.created_at as string,
    project_count: projectCounts.get(row.id as string) ?? 0,
    subscription_count: subCounts.get(row.id as string) ?? 0,
  }));

  return fromQueryResult("admin.getAdminCompanies", rows, null, []);
}

export async function getAdminCompanyById(
  companyId: string,
): Promise<DataFetchResult<Record<string, unknown> | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .is("deleted_at", null)
    .maybeSingle();

  return fromQueryResult("admin.getAdminCompanyById", data as Record<string, unknown> | null, error, null);
}

export async function getAdminProjects(): Promise<DataFetchResult<AdminProjectRow[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id, name, company_id, progress, due_date,
      companies ( name ),
      project_statuses ( label ),
      profiles:owner_id ( full_name )
    `,
    )
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    return fromQueryResult("admin.getAdminProjects", null, error, []);
  }

  const projectIds = (data ?? []).map((p) => p.id as string);
  const taskCounts = new Map<string, number>();

  if (projectIds.length) {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("project_id")
      .in("project_id", projectIds);
    for (const t of tasks ?? []) {
      const id = t.project_id as string;
      taskCounts.set(id, (taskCounts.get(id) ?? 0) + 1);
    }
  }

  const rows = (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    company_id: row.company_id as string,
    company_name: extractName(row.companies as { name: string } | { name: string }[] | null),
    progress: Number(row.progress ?? 0),
    status_label: (() => {
      const status = row.project_statuses as
        | { label: string }
        | { label: string }[]
        | null;
      const statusRow = Array.isArray(status) ? status[0] : status;
      return statusRow?.label ?? null;
    })(),
    due_date: (row.due_date as string | null) ?? null,
    owner_name: extractName(
      row.profiles as { full_name: string } | { full_name: string }[] | null,
      "full_name",
    ),
    task_count: taskCounts.get(row.id as string) ?? 0,
  }));

  return fromQueryResult("admin.getAdminProjects", rows, null, []);
}

export async function getAdminTasks(): Promise<DataFetchResult<AdminTaskRow[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
      id, title, status, priority, due_date, project_id,
      projects ( name, companies ( name ) ),
      profiles:assignee_id ( full_name )
    `,
    )
    .order("updated_at", { ascending: false });

  if (error) {
    return fromQueryResult("admin.getAdminTasks", null, error, []);
  }

  const rows = (data ?? []).map((row) => {
    const project = row.projects as
      | { name: string; companies: { name: string } | { name: string }[] | null }
      | { name: string; companies: { name: string } | { name: string }[] | null }[]
      | null;
    const projectRow = Array.isArray(project) ? project[0] : project;

    return {
      id: row.id as string,
      title: row.title as string,
      status: row.status as string,
      priority: row.priority as string,
      due_date: (row.due_date as string | null) ?? null,
      project_id: row.project_id as string,
      project_name: projectRow?.name ?? null,
      company_name: extractName(projectRow?.companies ?? null),
      assignee_name: extractName(
        row.profiles as { full_name: string } | { full_name: string }[] | null,
        "full_name",
      ),
    };
  });

  return fromQueryResult("admin.getAdminTasks", rows, null, []);
}

export async function getAdminTickets(): Promise<DataFetchResult<AdminTicketRow[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select(
      `
      id, subject, status, priority, company_id, created_at, updated_at,
      companies ( name ),
      projects ( name )
    `,
    )
    .order("updated_at", { ascending: false });

  if (error) {
    return fromQueryResult("admin.getAdminTickets", null, error, []);
  }

  const ticketIds = (data ?? []).map((t) => t.id as string);
  const messageCounts = new Map<string, number>();

  if (ticketIds.length) {
    const { data: messages } = await supabase
      .from("ticket_messages")
      .select("ticket_id")
      .in("ticket_id", ticketIds);
    for (const m of messages ?? []) {
      const id = m.ticket_id as string;
      messageCounts.set(id, (messageCounts.get(id) ?? 0) + 1);
    }
  }

  const rows = (data ?? []).map((row) => ({
    id: row.id as string,
    subject: row.subject as string,
    status: row.status as string,
    priority: row.priority as string,
    company_id: row.company_id as string,
    company_name: extractName(row.companies as { name: string } | { name: string }[] | null),
    project_name: extractName(row.projects as { name: string } | { name: string }[] | null),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    message_count: messageCounts.get(row.id as string) ?? 0,
  }));

  return fromQueryResult("admin.getAdminTickets", rows, null, []);
}

export async function getAdminSubscriptions(): Promise<DataFetchResult<AdminSubscriptionRow[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_subscriptions")
    .select(
      `
      id, company_id, status, price, currency, billing_period, started_at, current_period_end, service_plan_id,
      companies ( name ),
      services ( name )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    return fromQueryResult("admin.getAdminSubscriptions", null, error, []);
  }

  const planIds = [
    ...new Set(
      (data ?? [])
        .map((r) => r.service_plan_id as string | null)
        .filter(Boolean),
    ),
  ] as string[];

  const planMap = new Map<string, string>();
  if (planIds.length) {
    const { data: plans } = await supabase
      .from("service_plans")
      .select("id, name")
      .in("id", planIds);
    for (const p of plans ?? []) {
      planMap.set(p.id as string, p.name as string);
    }
  }

  const rows = (data ?? []).map((row) => ({
    id: row.id as string,
    company_id: row.company_id as string,
    company_name: extractName(row.companies as { name: string } | { name: string }[] | null),
    service_name: extractName(row.services as { name: string } | { name: string }[] | null),
    plan_name: row.service_plan_id ? planMap.get(row.service_plan_id as string) ?? null : null,
    status: row.status as string,
    price: row.price !== null ? Number(row.price) : null,
    currency: row.currency as string,
    billing_period: row.billing_period as string,
    started_at: row.started_at as string,
    current_period_end: (row.current_period_end as string | null) ?? null,
  }));

  return fromQueryResult("admin.getAdminSubscriptions", rows, null, []);
}

export async function getAdminRecentActivity(): Promise<
  DataFetchResult<
    Array<{ type: string; title: string; date: string; href?: string }>
  >
> {
  const supabase = await createClient();
  const [payments, tickets, projects, documents, meetings] = await Promise.all([
    supabase.from("payments").select("id, amount, currency, created_at").order("created_at", { ascending: false }).limit(3),
    supabase.from("tickets").select("id, subject, created_at").order("created_at", { ascending: false }).limit(3),
    supabase.from("projects").select("id, name, updated_at").order("updated_at", { ascending: false }).limit(3),
    supabase.from("documents").select("id, title, created_at").order("created_at", { ascending: false }).limit(3),
    supabase.from("meetings").select("id, title, starts_at").order("starts_at", { ascending: false }).limit(3),
  ]);

  const error =
    payments.error ?? tickets.error ?? projects.error ?? documents.error ?? meetings.error;

  if (error) {
    return fromQueryResult("admin.getAdminRecentActivity", null, error, []);
  }

  const items = [
    ...(payments.data ?? []).map((p) => ({
      type: "payment",
      title: `Payment ${p.amount} ${p.currency}`,
      date: p.created_at as string,
      href: "/admin/payments",
    })),
    ...(tickets.data ?? []).map((t) => ({
      type: "ticket",
      title: t.subject as string,
      date: t.created_at as string,
      href: `/admin/tickets/${t.id}`,
    })),
    ...(projects.data ?? []).map((p) => ({
      type: "project",
      title: p.name as string,
      date: p.updated_at as string,
      href: `/admin/projects/${p.id}`,
    })),
    ...(documents.data ?? []).map((d) => ({
      type: "document",
      title: d.title as string,
      date: d.created_at as string,
      href: "/admin/documents",
    })),
    ...(meetings.data ?? []).map((m) => ({
      type: "meeting",
      title: m.title as string,
      date: m.starts_at as string,
      href: "/admin/meetings",
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 12);

  return fromQueryResult("admin.getAdminRecentActivity", items, null, []);
}

export type AdminCompanyTab =
  | "overview"
  | "projects"
  | "services"
  | "tasks"
  | "tickets"
  | "documents"
  | "reports"
  | "meetings"
  | "invoices"
  | "payments"
  | "analytics"
  | "seo"
  | "activity";

export interface AdminCompanyDetail {
  id: string;
  name: string;
  tax_id: string | null;
  website: string | null;
  created_at: string;
}

export interface AdminCompanyUserRow {
  user_id: string;
  is_primary: boolean;
  email: string | null;
  full_name: string | null;
}

export interface AdminCompanyProjectRow {
  id: string;
  name: string;
  progress: number;
  status_label: string | null;
}

export interface AdminCompanySubscriptionRow {
  id: string;
  status: string;
  price: number | null;
  currency: string;
  billing_period: string;
  service_name: string | null;
}

export interface AdminCompanyTaskRow {
  id: string;
  title: string;
  status: string;
  project_id: string;
}

export interface AdminCompanyTicketRow {
  id: string;
  subject: string;
  status: string;
  updated_at: string;
}

export interface AdminCompanyDocumentRow {
  id: string;
  title: string;
  visibility: string;
  created_at: string;
}

export interface AdminCompanyReportRow {
  id: string;
  title: string;
  visibility: string;
  report_type: string;
  created_at: string;
}

export interface AdminCompanyMeetingRow {
  id: string;
  title: string;
  status: string;
  starts_at: string;
}

export interface AdminCompanyInvoiceRow {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
  currency: string;
}

export interface AdminCompanyPaymentRow {
  id: string;
  amount: number;
  status: string;
  currency: string;
  transaction_reference: string | null;
  created_at: string;
}

export interface AdminCompanyConnectionRow {
  id: string;
  status: string;
  display_name: string | null;
  property_id?: string | null;
  site_url?: string | null;
}

export interface AdminCompanyFeedbackRow {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string;
}

export interface AdminCompanyCore {
  company: AdminCompanyDetail;
  companyUsers: AdminCompanyUserRow[];
}

export interface AdminCompanyTabData {
  projects: AdminCompanyProjectRow[];
  subscriptions: AdminCompanySubscriptionRow[];
  tasks: AdminCompanyTaskRow[];
  tickets: AdminCompanyTicketRow[];
  documents: AdminCompanyDocumentRow[];
  reports: AdminCompanyReportRow[];
  meetings: AdminCompanyMeetingRow[];
  invoices: AdminCompanyInvoiceRow[];
  payments: AdminCompanyPaymentRow[];
  analyticsConn: AdminCompanyConnectionRow[];
  seoConn: AdminCompanyConnectionRow[];
  feedback: AdminCompanyFeedbackRow[];
}

function throwQueryError(context: string, error: PostgrestError): never {
  logDataQueryError(context, error);
  throw new Error(`[${context}] ${error.message}`);
}

function mapCompanyUsers(
  rows: Array<{
    user_id: string;
    is_primary: boolean;
    profiles:
      | { email?: string | null; full_name?: string | null }
      | Array<{ email?: string | null; full_name?: string | null }>
      | null;
  }>,
): AdminCompanyUserRow[] {
  return rows.map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      user_id: row.user_id,
      is_primary: Boolean(row.is_primary),
      email: profile?.email ?? null,
      full_name: profile?.full_name ?? null,
    };
  });
}

async function fetchCompanyProjectIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("company_id", companyId)
    .is("deleted_at", null);

  if (error) throwQueryError("admin.getAdminCompanyTabData.projectIds", error);
  return (data ?? []).map((row) => row.id as string);
}

/** Customer 360 — company header + contacts (always loaded). */
export async function getAdminCompanyCore(
  companyId: string,
): Promise<AdminCompanyCore | null> {
  const supabase = await createClient();

  const companyResult = await supabase
    .from("companies")
    .select("id, name, tax_id, website, created_at")
    .eq("id", companyId)
    .is("deleted_at", null)
    .maybeSingle();

  if (companyResult.error) {
    throwQueryError("admin.getAdminCompanyCore.company", companyResult.error);
  }
  if (!companyResult.data) return null;

  const usersResult = await supabase
    .from("company_users")
    .select("user_id, is_primary, profiles ( email, full_name )")
    .eq("company_id", companyId);

  if (usersResult.error) {
    throwQueryError("admin.getAdminCompanyCore.companyUsers", usersResult.error);
  }

  return {
    company: companyResult.data as AdminCompanyDetail,
    companyUsers: mapCompanyUsers(usersResult.data ?? []),
  };
}

const EMPTY_TAB_DATA: AdminCompanyTabData = {
  projects: [],
  subscriptions: [],
  tasks: [],
  tickets: [],
  documents: [],
  reports: [],
  meetings: [],
  invoices: [],
  payments: [],
  analyticsConn: [],
  seoConn: [],
  feedback: [],
};

/** Customer 360 — tab-scoped data (loads only what the active tab needs). */
export async function getAdminCompanyTabData(
  companyId: string,
  tab: AdminCompanyTab,
): Promise<AdminCompanyTabData> {
  if (tab === "overview") return EMPTY_TAB_DATA;

  const supabase = await createClient();

  switch (tab) {
    case "projects": {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, progress, project_statuses ( label )")
        .eq("company_id", companyId)
        .is("deleted_at", null);
      if (error) throwQueryError("admin.getAdminCompanyTabData.projects", error);
      return {
        ...EMPTY_TAB_DATA,
        projects: (data ?? []).map((row) => {
          const status = row.project_statuses as
            | { label?: string | null }
            | Array<{ label?: string | null }>
            | null;
          const statusRow = Array.isArray(status) ? status[0] : status;
          return {
            id: row.id as string,
            name: row.name as string,
            progress: Number(row.progress ?? 0),
            status_label: statusRow?.label ?? null,
          };
        }),
      };
    }
    case "services": {
      const { data, error } = await supabase
        .from("client_subscriptions")
        .select("id, status, price, currency, billing_period, services ( name )")
        .eq("company_id", companyId);
      if (error) throwQueryError("admin.getAdminCompanyTabData.subscriptions", error);
      return {
        ...EMPTY_TAB_DATA,
        subscriptions: (data ?? []).map((row) => ({
          id: row.id as string,
          status: row.status as string,
          price: row.price === null ? null : Number(row.price),
          currency: row.currency as string,
          billing_period: row.billing_period as string,
          service_name: extractName(
            row.services as { name?: string } | Array<{ name?: string }> | null,
          ),
        })),
      };
    }
    case "tasks": {
      const projectIds = await fetchCompanyProjectIds(supabase, companyId);
      if (!projectIds.length) return EMPTY_TAB_DATA;
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, project_id")
        .in("project_id", projectIds)
        .limit(20);
      if (error) throwQueryError("admin.getAdminCompanyTabData.tasks", error);
      return {
        ...EMPTY_TAB_DATA,
        tasks: (data ?? []).map((row) => ({
          id: row.id as string,
          title: row.title as string,
          status: row.status as string,
          project_id: row.project_id as string,
        })),
      };
    }
    case "tickets": {
      const { data, error } = await supabase
        .from("tickets")
        .select("id, subject, status, updated_at")
        .eq("company_id", companyId)
        .order("updated_at", { ascending: false })
        .limit(10);
      if (error) throwQueryError("admin.getAdminCompanyTabData.tickets", error);
      return { ...EMPTY_TAB_DATA, tickets: (data ?? []) as AdminCompanyTicketRow[] };
    }
    case "documents": {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, visibility, created_at")
        .eq("company_id", companyId)
        .is("deleted_at", null);
      if (error) throwQueryError("admin.getAdminCompanyTabData.documents", error);
      return { ...EMPTY_TAB_DATA, documents: (data ?? []) as AdminCompanyDocumentRow[] };
    }
    case "reports": {
      const { data, error } = await supabase
        .from("reports")
        .select("id, title, visibility, report_type, created_at")
        .eq("company_id", companyId);
      if (error) throwQueryError("admin.getAdminCompanyTabData.reports", error);
      return { ...EMPTY_TAB_DATA, reports: (data ?? []) as AdminCompanyReportRow[] };
    }
    case "meetings": {
      const { data, error } = await supabase
        .from("meetings")
        .select("id, title, status, starts_at")
        .eq("company_id", companyId)
        .order("starts_at", { ascending: false });
      if (error) throwQueryError("admin.getAdminCompanyTabData.meetings", error);
      return { ...EMPTY_TAB_DATA, meetings: (data ?? []) as AdminCompanyMeetingRow[] };
    }
    case "invoices": {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, status, total, currency")
        .eq("company_id", companyId);
      if (error) throwQueryError("admin.getAdminCompanyTabData.invoices", error);
      return {
        ...EMPTY_TAB_DATA,
        invoices: (data ?? []).map((row) => ({
          id: row.id as string,
          invoice_number: row.invoice_number as string,
          status: row.status as string,
          total: Number(row.total),
          currency: row.currency as string,
        })),
      };
    }
    case "payments": {
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, status, currency, transaction_reference, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throwQueryError("admin.getAdminCompanyTabData.payments", error);
      return {
        ...EMPTY_TAB_DATA,
        payments: (data ?? []).map((row) => ({
          id: row.id as string,
          amount: Number(row.amount),
          status: row.status as string,
          currency: row.currency as string,
          transaction_reference: (row.transaction_reference as string | null) ?? null,
          created_at: row.created_at as string,
        })),
      };
    }
    case "analytics": {
      const { data, error } = await supabase
        .from("analytics_connections")
        .select("id, property_id, status, display_name")
        .eq("company_id", companyId);
      if (error) throwQueryError("admin.getAdminCompanyTabData.analytics", error);
      return {
        ...EMPTY_TAB_DATA,
        analyticsConn: (data ?? []).map((row) => ({
          id: row.id as string,
          status: row.status as string,
          display_name: (row.display_name as string | null) ?? null,
          property_id: (row.property_id as string | null) ?? null,
        })),
      };
    }
    case "seo": {
      const { data, error } = await supabase
        .from("seo_connections")
        .select("id, site_url, status, display_name")
        .eq("company_id", companyId);
      if (error) throwQueryError("admin.getAdminCompanyTabData.seo", error);
      return {
        ...EMPTY_TAB_DATA,
        seoConn: (data ?? []).map((row) => ({
          id: row.id as string,
          status: row.status as string,
          display_name: (row.display_name as string | null) ?? null,
          site_url: (row.site_url as string | null) ?? null,
        })),
      };
    }
    case "activity": {
      const [tickets, payments] = await Promise.all([
        supabase
          .from("tickets")
          .select("id, subject, status, updated_at")
          .eq("company_id", companyId)
          .order("updated_at", { ascending: false })
          .limit(10),
        supabase
          .from("payments")
          .select("id, amount, status, currency, transaction_reference, created_at")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      if (tickets.error) throwQueryError("admin.getAdminCompanyTabData.activity.tickets", tickets.error);
      if (payments.error) throwQueryError("admin.getAdminCompanyTabData.activity.payments", payments.error);
      return {
        ...EMPTY_TAB_DATA,
        tickets: (tickets.data ?? []) as AdminCompanyTicketRow[],
        payments: (payments.data ?? []).map((row) => ({
          id: row.id as string,
          amount: Number(row.amount),
          status: row.status as string,
          currency: row.currency as string,
          transaction_reference: (row.transaction_reference as string | null) ?? null,
          created_at: row.created_at as string,
        })),
      };
    }
    default:
      return EMPTY_TAB_DATA;
  }
}

export async function getAdminProjectDetail(projectId: string) {
  const supabase = await createClient();

  const [project, milestones, tasks, members, documents, reports, meetings] =
    await Promise.all([
      supabase
        .from("projects")
        .select(
          `
          *,
          companies ( name ),
          project_statuses ( label, slug, color ),
          profiles:owner_id ( full_name, email )
        `,
        )
        .eq("id", projectId)
        .maybeSingle(),
      supabase
        .from("project_milestones")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true }),
      supabase.from("tasks").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
      supabase
        .from("project_members")
        .select("project_id, user_id, role, profiles ( full_name, email )")
        .eq("project_id", projectId),
      supabase.from("documents").select("id, title, visibility, created_at").eq("project_id", projectId).is("deleted_at", null),
      supabase.from("reports").select("id, title, visibility, report_type").eq("project_id", projectId),
      supabase.from("meetings").select("id, title, status, starts_at").eq("project_id", projectId),
    ]);

  return {
    project: project.data,
    milestones: milestones.data ?? [],
    tasks: tasks.data ?? [],
    members: members.data ?? [],
    documents: documents.data ?? [],
    reports: reports.data ?? [],
    meetings: meetings.data ?? [],
    error: project.error,
  };
}

export async function getAdminTicketDetail(ticketId: string) {
  const supabase = await createClient();
  const [ticket, messages] = await Promise.all([
    supabase
      .from("tickets")
      .select(
        `
        *,
        companies ( name ),
        projects ( name )
      `,
      )
      .eq("id", ticketId)
      .maybeSingle(),
    supabase
      .from("ticket_messages")
      .select("id, body, created_at, author_id")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true }),
  ]);

  return {
    ticket: ticket.data,
    messages: messages.data ?? [],
    error: ticket.error ?? messages.error,
  };
}

export async function getAdminDocuments(): Promise<
  DataFetchResult<
    Array<{
      id: string;
      title: string;
      category: string;
      visibility: string;
      company_name: string | null;
      project_name: string | null;
      created_at: string;
    }>
  >
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, title, category, visibility, created_at, companies ( name ), projects ( name )",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return fromQueryResult("admin.getAdminDocuments", null, error, []);

  const rows = (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    category: row.category as string,
    visibility: row.visibility as string,
    company_name: extractName(row.companies as { name: string } | { name: string }[] | null),
    project_name: extractName(row.projects as { name: string } | { name: string }[] | null),
    created_at: row.created_at as string,
  }));

  return fromQueryResult("admin.getAdminDocuments", rows, null, []);
}

export async function getAdminReports(): Promise<
  DataFetchResult<
    Array<{
      id: string;
      title: string;
      report_type: string;
      visibility: string;
      company_name: string | null;
      project_name: string | null;
      created_at: string;
    }>
  >
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, title, report_type, visibility, created_at, companies ( name ), projects ( name )",
    )
    .order("created_at", { ascending: false });

  if (error) return fromQueryResult("admin.getAdminReports", null, error, []);

  const rows = (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    report_type: row.report_type as string,
    visibility: row.visibility as string,
    company_name: extractName(row.companies as { name: string } | { name: string }[] | null),
    project_name: extractName(row.projects as { name: string } | { name: string }[] | null),
    created_at: row.created_at as string,
  }));

  return fromQueryResult("admin.getAdminReports", rows, null, []);
}

export async function getAdminMeetings(): Promise<
  DataFetchResult<
    Array<{
      id: string;
      title: string;
      status: string;
      starts_at: string;
      company_name: string | null;
      project_name: string | null;
    }>
  >
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .select("id, title, status, starts_at, companies ( name ), projects ( name )")
    .order("starts_at", { ascending: false });

  if (error) return fromQueryResult("admin.getAdminMeetings", null, error, []);

  const rows = (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    status: row.status as string,
    starts_at: row.starts_at as string,
    company_name: extractName(row.companies as { name: string } | { name: string }[] | null),
    project_name: extractName(row.projects as { name: string } | { name: string }[] | null),
  }));

  return fromQueryResult("admin.getAdminMeetings", rows, null, []);
}

export async function getAdminMeetingsGrouped(): Promise<
  DataFetchResult<{
    upcoming: Awaited<ReturnType<typeof getAdminMeetings>>["data"];
    past: Awaited<ReturnType<typeof getAdminMeetings>>["data"];
  }>
> {
  const result = await getAdminMeetings();
  const nowIso = new Date().toISOString();
  const grouped = {
    upcoming: result.data.filter((m) => m.starts_at >= nowIso),
    past: result.data.filter((m) => m.starts_at < nowIso),
  };

  if (result.error) {
    return {
      data: { upcoming: [], past: [] },
      error: result.error,
      accessDenied: result.accessDenied,
      skipped: result.skipped,
    };
  }

  return {
    data: grouped,
    error: null,
    accessDenied: false,
    skipped: false,
  };
}

export async function getAdminPayments(): Promise<
  DataFetchResult<
    Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      provider: string | null;
      reference: string | null;
      company_name: string | null;
      invoice_number: string | null;
      created_at: string;
    }>
  >
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, amount, currency, status, provider, transaction_reference, created_at, companies ( name ), invoices ( invoice_number )",
    )
    .order("created_at", { ascending: false });

  if (error) return fromQueryResult("admin.getAdminPayments", null, error, []);

  const rows = (data ?? []).map((row) => ({
    id: row.id as string,
    amount: Number(row.amount),
    currency: row.currency as string,
    status: row.status as string,
    provider: (row.provider as string | null) ?? null,
    reference: (row.transaction_reference as string | null) ?? null,
    company_name: extractName(row.companies as { name: string } | { name: string }[] | null),
    invoice_number: (() => {
      const inv = row.invoices as
        | { invoice_number: string }
        | { invoice_number: string }[]
        | null;
      const invRow = Array.isArray(inv) ? inv[0] : inv;
      return invRow?.invoice_number ?? null;
    })(),
    created_at: row.created_at as string,
  }));

  return fromQueryResult("admin.getAdminPayments", rows, null, []);
}

export async function getAdminInvoices(): Promise<
  DataFetchResult<
    Array<{
      id: string;
      invoice_number: string;
      status: string;
      total: number;
      currency: string;
      issue_date: string | null;
      due_date: string | null;
      company_name: string | null;
    }>
  >
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, status, total, currency, issue_date, due_date, companies ( name )",
    )
    .order("created_at", { ascending: false });

  if (error) return fromQueryResult("admin.getAdminInvoices", null, error, []);

  const rows = (data ?? []).map((row) => ({
    id: row.id as string,
    invoice_number: row.invoice_number as string,
    status: row.status as string,
    total: Number(row.total),
    currency: row.currency as string,
    issue_date: (row.issue_date as string | null) ?? null,
    due_date: (row.due_date as string | null) ?? null,
    company_name: extractName(row.companies as { name: string } | { name: string }[] | null),
  }));

  return fromQueryResult("admin.getAdminInvoices", rows, null, []);
}

export async function getAdminInvoiceDetail(invoiceId: string) {
  const supabase = await createClient();
  const [invoice, items] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, companies ( name )")
      .eq("id", invoiceId)
      .maybeSingle(),
    supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("sort_order", { ascending: true }),
  ]);

  return {
    invoice: invoice.data,
    items: items.data ?? [],
    error: invoice.error ?? items.error,
  };
}

export async function getAdminAnalytics(companyId?: string) {
  const supabase = await createClient();
  let connQuery = supabase
    .from("analytics_connections")
    .select("id, company_id, property_id, display_name, status, companies ( name )")
    .order("connected_at", { ascending: false });

  if (companyId) connQuery = connQuery.eq("company_id", companyId);

  const { data: connections, error: connError } = await connQuery;
  if (connError) return { connections: [], metrics: [], error: connError };

  const connIds = (connections ?? []).map((c) => c.id as string);
  let metrics: Record<string, unknown>[] = [];
  if (connIds.length) {
    const { data } = await supabase
      .from("analytics_data")
      .select("id, connection_id, metric_date, users, sessions, page_views, conversions")
      .in("connection_id", connIds)
      .order("metric_date", { ascending: true });
    metrics = (data ?? []) as Record<string, unknown>[];
  }

  return { connections: connections ?? [], metrics, error: null };
}

export async function getAdminSeo(companyId?: string) {
  const supabase = await createClient();
  let connQuery = supabase
    .from("seo_connections")
    .select("id, company_id, site_url, display_name, status, companies ( name )")
    .order("connected_at", { ascending: false });

  if (companyId) connQuery = connQuery.eq("company_id", companyId);

  const { data: connections, error: connError } = await connQuery;
  if (connError) return { connections: [], metrics: [], error: connError };

  const connIds = (connections ?? []).map((c) => c.id as string);
  let metrics: Record<string, unknown>[] = [];

  if (connIds.length) {
    const { data: metricData } = await supabase
      .from("seo_data")
      .select("id, connection_id, metric_date, clicks, impressions, ctr, average_position")
      .in("connection_id", connIds)
      .order("metric_date", { ascending: true });
    metrics = (metricData ?? []) as Record<string, unknown>[];
  }

  return { connections: connections ?? [], metrics, error: null };
}

export async function getAdminNotifications(): Promise<
  DataFetchResult<
    Array<{
      id: string;
      type: string;
      title: string;
      body: string | null;
      category: string | null;
      read_at: string | null;
      created_at: string;
      company_name: string | null;
    }>
  >
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, type, title, body, category, read_at, created_at, companies ( name )",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return fromQueryResult("admin.getAdminNotifications", null, error, []);

  const rows = (data ?? []).map((row) => ({
    id: row.id as string,
    type: row.type as string,
    title: row.title as string,
    body: (row.body as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    read_at: (row.read_at as string | null) ?? null,
    created_at: row.created_at as string,
    company_name: extractName(row.companies as { name: string } | { name: string }[] | null),
  }));

  return fromQueryResult("admin.getAdminNotifications", rows, null, []);
}

export async function getAdminCompaniesForSelect(): Promise<
  DataFetchResult<Array<{ id: string; name: string }>>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id, name")
    .is("deleted_at", null)
    .order("name");

  return fromQueryResult("admin.getAdminCompaniesForSelect", data ?? [], error, []);
}

export async function getAdminServicesCatalog() {
  const supabase = await createClient();
  const { data: services, error } = await supabase
    .from("services")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name");

  if (error) return { services: [], plans: [], error };

  const serviceIds = (services ?? []).map((s) => s.id as string);
  let plans: Record<string, unknown>[] = [];
  if (serviceIds.length) {
    const { data: planData } = await supabase
      .from("service_plans")
      .select("id, name, service_id, price, currency, billing_period")
      .in("service_id", serviceIds)
      .eq("is_active", true)
      .order("sort_order");
    plans = (planData ?? []) as Record<string, unknown>[];
  }

  return { services: services ?? [], plans, error: null };
}

export async function getCompanyUsers(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_users")
    .select("user_id, is_primary, profiles ( id, email, full_name )")
    .eq("company_id", companyId);

  return { users: data ?? [], error };
}

export async function getSubscriptionDetails(subscriptionId: string) {
  const supabase = await createClient();
  const [sub, overrides, entitlements] = await Promise.all([
    supabase
      .from("client_subscriptions")
      .select("*, services ( name ), service_plans ( name )")
      .eq("id", subscriptionId)
      .maybeSingle(),
    supabase
      .from("subscription_feature_overrides")
      .select("*")
      .eq("subscription_id", subscriptionId),
    supabase
      .from("subscription_entitlements")
      .select("*")
      .eq("subscription_id", subscriptionId),
  ]);

  return {
    subscription: sub.data,
    overrides: overrides.data ?? [],
    entitlements: entitlements.data ?? [],
    error: sub.error ?? overrides.error ?? entitlements.error,
  };
}

export async function getStaffProfilesForAssignment() {
  const supabase = await createClient();
  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("user_id, roles!inner ( slug )");

  const staffUserIds = [
    ...new Set(
      (roleRows ?? [])
        .filter((row) => {
          const role = row.roles as { slug: string } | { slug: string }[] | null;
          const slug = Array.isArray(role) ? role[0]?.slug : role?.slug;
          return slug && slug !== "client";
        })
        .map((row) => row.user_id as string),
    ),
  ];

  if (!staffUserIds.length) return [];

  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", staffUserIds)
    .order("full_name");

  return data ?? [];
}

export async function getProjectsForCompany(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name")
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("name");

  return { projects: data ?? [], error };
}
