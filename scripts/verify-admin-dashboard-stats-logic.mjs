/**
 * Equivalence tests: legacy in-memory dashboard stats vs count-based derivation.
 * No database — uses synthetic fixtures only.
 *
 * Usage: node scripts/verify-admin-dashboard-stats-logic.mjs
 */

/** @typedef {{ id: string; progress: number; statusSlug: string | null }} ProjectRow */
/** @typedef {{ id: string; status: string }} StatusRow */
/** @typedef {{ price: number | null; billing_period: string; status: string }} SubRow */

function slugFromRow(p) {
  return p.statusSlug ?? null;
}

/** Legacy logic (pre-optimization) from committed getAdminDashboardStats. */
function deriveLegacyStats(input) {
  const {
    projects,
    tickets,
    tasks,
    payments,
    invoices,
    meetings,
    subscriptions,
    clientsCount,
  } = input;

  const completedProjects = projects.filter((p) => {
    const slug = slugFromRow(p);
    return slug === "completed" || Number(p.progress) >= 100;
  }).length;

  const openTickets = tickets.filter((t) => !["resolved", "closed"].includes(t.status)).length;
  const pendingTasks = tasks.filter(
    (t) => !["done", "completed", "cancelled"].includes(t.status),
  ).length;
  const succeededPayments = payments.filter((p) => p.status === "succeeded").length;
  const pendingInvoices = invoices.filter((i) =>
    ["issued", "sent", "overdue", "partially_paid"].includes(i.status),
  ).length;

  const activeSubs = subscriptions.filter((s) =>
    ["trialing", "active", "past_due"].includes(s.status),
  );

  const mrr = activeSubs.reduce((sum, sub) => {
    if (sub.billing_period !== "monthly" || sub.price === null) return sum;
    return sum + Number(sub.price);
  }, 0);

  return {
    clients: clientsCount,
    activeProjects: projects.length - completedProjects,
    completedProjects,
    openTickets,
    pendingTasks,
    succeededPayments,
    pendingInvoices,
    upcomingMeetings: meetings.length,
    activeSubscriptions: activeSubs.length,
    monthlyRecurringRevenue: mrr,
  };
}

/** Count-based derivation mirroring optimized SQL filters. */
function deriveOptimizedStats(input) {
  const {
    projects,
    tickets,
    tasks,
    payments,
    invoices,
    meetings,
    subscriptions,
    clientsCount,
  } = input;

  const totalProjects = projects.length;
  const atFullProgress = projects.filter((p) => Number(p.progress) >= 100).length;
  const completedByStatus = projects.filter(
    (p) => Number(p.progress) < 100 && slugFromRow(p) === "completed",
  ).length;
  const completedProjects = atFullProgress + completedByStatus;

  const openTickets = tickets.filter((t) => !["resolved", "closed"].includes(t.status)).length;
  const pendingTasks = tasks.filter(
    (t) => !["done", "completed", "cancelled"].includes(t.status),
  ).length;
  const succeededPayments = payments.filter((p) => p.status === "succeeded").length;
  const pendingInvoices = invoices.filter((i) =>
    ["issued", "sent", "overdue", "partially_paid"].includes(i.status),
  ).length;

  const activeSubs = subscriptions.filter((s) =>
    ["trialing", "active", "past_due"].includes(s.status),
  );
  const mrr = activeSubs
    .filter((s) => s.billing_period === "monthly" && s.price !== null)
    .reduce((sum, s) => sum + Number(s.price), 0);

  return {
    clients: clientsCount,
    activeProjects: totalProjects - completedProjects,
    completedProjects,
    openTickets,
    pendingTasks,
    succeededPayments,
    pendingInvoices,
    upcomingMeetings: meetings.length,
    activeSubscriptions: activeSubs.length,
    monthlyRecurringRevenue: mrr,
  };
}

function assertEqual(a, b, label) {
  const keys = Object.keys(a);
  for (const k of keys) {
    if (a[k] !== b[k]) {
      throw new Error(`${label}: mismatch on ${k}: legacy=${a[k]} optimized=${b[k]}`);
    }
  }
}

const projects = [
  { id: "p1", progress: 100, statusSlug: "completed" },
  { id: "p2", progress: 100, statusSlug: "in_progress" },
  { id: "p3", progress: 80, statusSlug: "completed" },
  { id: "p4", progress: 40, statusSlug: "in_progress" },
  { id: "p5", progress: 0, statusSlug: null },
];

const tickets = [
  { id: "t1", status: "open" },
  { id: "t2", status: "resolved" },
  { id: "t3", status: "closed" },
  { id: "t4", status: "pending" },
];

const tasks = [
  { id: "k1", status: "todo" },
  { id: "k2", status: "done" },
  { id: "k3", status: "cancelled" },
  { id: "k4", status: "in_progress" },
];

const payments = [
  { id: "pay1", status: "succeeded" },
  { id: "pay2", status: "failed" },
  { id: "pay3", status: "succeeded" },
];

const invoices = [
  { id: "i1", status: "issued" },
  { id: "i2", status: "paid" },
  { id: "i3", status: "overdue" },
  { id: "i4", status: "partially_paid" },
];

const meetings = [{ id: "m1" }, { id: "m2" }];

const subscriptions = [
  { price: 50, billing_period: "monthly", status: "active" },
  { price: 600, billing_period: "yearly", status: "active" },
  { price: null, billing_period: "monthly", status: "active" },
  { price: 25, billing_period: "monthly", status: "canceled" },
  { price: 10, billing_period: "monthly", status: "trialing" },
];

const fixture = {
  projects,
  tickets,
  tasks,
  payments,
  invoices,
  meetings,
  subscriptions,
  clientsCount: 7,
};

const legacy = deriveLegacyStats(fixture);
const optimized = deriveOptimizedStats(fixture);

assertEqual(legacy, optimized, "primary fixture");

// Explicit: no double-count when progress 100 and slug completed
const doubleCheck = deriveOptimizedStats({
  ...fixture,
  projects: [{ id: "x", progress: 100, statusSlug: "completed" }],
});
if (doubleCheck.completedProjects !== 1 || doubleCheck.activeProjects !== 0) {
  throw new Error("double-count guard failed");
}

console.log("PASS  legacy vs optimized dashboard stats (fixture)");
console.log(JSON.stringify(legacy, null, 2));
