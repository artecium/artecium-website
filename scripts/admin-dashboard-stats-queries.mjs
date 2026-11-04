/**
 * Mirrors the 11 PostgREST queries in getAdminDashboardStats (src/lib/data/admin/queries.ts).
 * Used by RLS probes — keep in sync with that function.
 */

/** @typedef {{ key: string; label: string; error: import('@supabase/supabase-js').PostgrestError | null; count: number | null; rowCount: number | null; mrrSum: number | null }} DashboardStatsQueryProbe */

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} [nowIso]
 * @returns {Promise<DashboardStatsQueryProbe[]>}
 */
export async function runAdminDashboardStatsQueries(supabase, nowIso = new Date().toISOString()) {
  const [
    companies,
    projects,
    projectsAtFullProgress,
    projectsCompletedByStatus,
    openTickets,
    pendingTasks,
    succeededPayments,
    pendingInvoices,
    meetings,
    subscriptions,
    monthlySubscriptions,
  ] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("projects").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("progress", 100),
    supabase
      .from("projects")
      .select("id, project_statuses!inner(slug)", { count: "exact", head: true })
      .is("deleted_at", null)
      .lt("progress", 100)
      .eq("project_statuses.slug", "completed"),
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(resolved,closed)"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(done,completed,cancelled)"),
    supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("status", "succeeded"),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .in("status", ["issued", "sent", "overdue", "partially_paid"]),
    supabase.from("meetings").select("id", { count: "exact", head: true }).gte("starts_at", nowIso),
    supabase
      .from("client_subscriptions")
      .select("id", { count: "exact", head: true })
      .in("status", ["trialing", "active", "past_due"]),
    supabase
      .from("client_subscriptions")
      .select("price")
      .in("status", ["trialing", "active", "past_due"])
      .eq("billing_period", "monthly")
      .not("price", "is", null),
  ]);

  const mrrSum = (monthlySubscriptions.data ?? []).reduce(
    (sum, sub) => sum + Number(sub.price),
    0,
  );

  return [
    probe("companies", "Companies (active)", companies),
    probe("projects_total", "Projects (total)", projects),
    probe("projects_progress_100", "Projects (progress ≥ 100)", projectsAtFullProgress),
    probe("projects_completed_slug", "Projects (completed slug, progress < 100)", projectsCompletedByStatus),
    probe("tickets_open", "Tickets (open)", openTickets),
    probe("tasks_pending", "Tasks (pending)", pendingTasks),
    probe("payments_succeeded", "Payments (succeeded)", succeededPayments),
    probe("invoices_pending", "Invoices (pending statuses)", pendingInvoices),
    probe("meetings_upcoming", "Meetings (upcoming)", meetings),
    probe("subscriptions_active", "Subscriptions (active statuses)", subscriptions),
    {
      key: "subscriptions_mrr",
      label: "Subscriptions (monthly MRR rows)",
      error: monthlySubscriptions.error,
      count: null,
      rowCount: monthlySubscriptions.data?.length ?? null,
      mrrSum,
    },
  ];
}

/**
 * @param {string} key
 * @param {string} label
 * @param {{ error: import('@supabase/supabase-js').PostgrestError | null; count?: number | null; data?: unknown[] | null }} result
 * @returns {DashboardStatsQueryProbe}
 */
function probe(key, label, result) {
  return {
    key,
    label,
    error: result.error ?? null,
    count: result.count ?? null,
    rowCount: null,
    mrrSum: null,
  };
}

/** @param {import('@supabase/supabase-js').PostgrestError | null | undefined} error */
export function isPermissionDenied(error) {
  if (!error) return false;
  return (
    error.code === "42501" ||
    (error.message ?? "").toLowerCase().includes("permission denied")
  );
}

/** @param {DashboardStatsQueryProbe} p */
export function metricValue(p) {
  if (p.key === "subscriptions_mrr") return p.rowCount ?? 0;
  return p.count ?? 0;
}
