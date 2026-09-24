import { PayInvoiceButton } from "@/components/client/PayInvoiceButton";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import {
  getClientInvoices,
  getInvoiceAmountDue,
  type ClientInvoiceRow,
} from "@/lib/data/client-invoices";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { requireClientAuth } from "@/lib/auth/session";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatCurrency(amount: number | null, currency: string): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ").toUpperCase();
}

function invoiceStatusTone(
  status: string,
): "default" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "paid":
      return "success";
    case "issued":
    case "sent":
    case "viewed":
      return "info";
    case "partially_paid":
      return "warning";
    case "overdue":
      return "danger";
    default:
      return "default";
  }
}

function listSectionMessage(
  result: {
    data: unknown[];
    error: string | null;
    accessDenied: boolean;
    skipped: boolean;
  },
  emptyDescription: string,
): { hasData: boolean; emptyTitle: string; emptyDescription: string } {
  if (result.data.length > 0) {
    return { hasData: true, emptyTitle: "", emptyDescription: "" };
  }

  if (result.skipped) {
    return {
      hasData: false,
      emptyTitle: "Company context unavailable",
      emptyDescription:
        "Your account is not linked to a company yet, so invoices cannot be loaded.",
    };
  }

  if (result.accessDenied) {
    return {
      hasData: false,
      emptyTitle: "Unable to load data",
      emptyDescription:
        "Access to invoices was denied. Contact support if this persists.",
    };
  }

  if (result.error) {
    return {
      hasData: false,
      emptyTitle: "Unable to load data",
      emptyDescription: "Something went wrong while loading your invoices.",
    };
  }

  return {
    hasData: false,
    emptyTitle: "No invoices yet",
    emptyDescription,
  };
}

function getOutstandingAmount(invoice: ClientInvoiceRow): number | null {
  if (invoice.total === null) return null;
  return Math.max(invoice.total - invoice.amount_paid, 0);
}

function canPayInvoice(invoice: ClientInvoiceRow): boolean {
  if (["paid", "cancelled", "refunded"].includes(invoice.status)) {
    return false;
  }
  const amountDue = getInvoiceAmountDue(invoice);
  return amountDue !== null && amountDue > 0;
}

function InvoiceCard({ invoice }: { invoice: ClientInvoiceRow }) {
  const outstanding = getOutstandingAmount(invoice);
  const showPayButton = canPayInvoice(invoice);

  return (
    <li className="rounded-xl border border-[#1E293B] bg-[#050816]/40 px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-medium text-white">
              {invoice.invoice_number ?? "Invoice"}
            </h2>
            <StatusBadge
              label={formatStatusLabel(invoice.status)}
              tone={invoiceStatusTone(invoice.status)}
            />
          </div>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#64748B]">
                Issue date
              </dt>
              <dd className="mt-0.5 text-[#94A3B8]">
                {formatDate(invoice.issue_date)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#64748B]">
                Due date
              </dt>
              <dd className="mt-0.5 text-[#94A3B8]">
                {formatDate(invoice.due_date)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="shrink-0 sm:text-right">
          <p className="text-xs uppercase tracking-wide text-[#64748B]">Total</p>
          <p className="mt-0.5 text-lg font-semibold text-white">
            {formatCurrency(invoice.total, invoice.currency)}
          </p>
          <p className="mt-2 text-xs text-[#64748B]">
            Paid:{" "}
            <span className="text-[#94A3B8]">
              {formatCurrency(invoice.amount_paid, invoice.currency)}
            </span>
          </p>
          {outstanding !== null ? (
            <p className="mt-1 text-xs text-[#64748B]">
              Due:{" "}
              <span
                className={
                  outstanding > 0 ? "font-medium text-amber-300" : "text-[#94A3B8]"
                }
              >
                {formatCurrency(outstanding, invoice.currency)}
              </span>
            </p>
          ) : null}
        </div>
      </div>

      {invoice.items.length ? (
        <div className="mt-4 border-t border-[#1E293B] pt-4">
          <h3 className="text-xs uppercase tracking-wide text-[#64748B]">Line items</h3>
          <ul className="mt-2 space-y-2">
            {invoice.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 text-sm text-[#94A3B8]">
                <span>{item.description}</span>
                <span>
                  {item.quantity} × {formatCurrency(item.unit_price, invoice.currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showPayButton ? <PayInvoiceButton invoiceId={invoice.id} /> : null}
    </li>
  );
}

export default async function ClientInvoicesPage() {
  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;

  const dbState = await getDatabaseReadyState();
  const invoicesResult = await getClientInvoices(companyIds);
  const invoices = invoicesResult.data;
  const section = listSectionMessage(
    invoicesResult,
    "Your invoices will appear here once they are issued.",
  );

  return (
    <>
      <PageHeader
        title="Invoices"
        description="View and download your invoices."
      />

      {!dbState.configured ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {dbState.message}
        </div>
      ) : null}

      {section.hasData ? (
        <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-4 sm:p-6">
          <ul className="space-y-3">
            {invoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} />
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState
          title={section.emptyTitle}
          description={section.emptyDescription}
        />
      )}
    </>
  );
}
