import { PayInvoiceButton } from "@/components/client/PayInvoiceButton";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { resolveLocale, type AppLocale } from "@/i18n/config";
import {
  getClientInvoices,
  getInvoiceAmountDue,
  type ClientInvoiceRow,
} from "@/lib/data/client-invoices";
import {
  formatCurrency,
  formatDate,
  formatStatusLabel,
} from "@/lib/data/client-format";
import { invoiceStatusTone } from "@/lib/i18n/status";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { requireClientAuth } from "@/lib/auth/session";
import { getLocale, getTranslations } from "next-intl/server";
import type { DataFetchResult } from "@/lib/data/supabase-query";

function invoiceListSectionMessage(
  result: Pick<DataFetchResult<unknown[]>, "data" | "error" | "accessDenied" | "skipped">,
  tErrors: (key: string) => string,
  emptyTitle: string,
  emptyDescription: string,
): { hasData: boolean; emptyTitle: string; emptyDescription: string } {
  if (result.data.length > 0) {
    return { hasData: true, emptyTitle: "", emptyDescription: "" };
  }

  if (result.skipped) {
    return {
      hasData: false,
      emptyTitle: tErrors("companyUnavailableTitle"),
      emptyDescription: tErrors("invoicesCompanyUnavailable"),
    };
  }

  if (result.accessDenied) {
    return {
      hasData: false,
      emptyTitle: tErrors("accessDeniedTitle"),
      emptyDescription: tErrors("invoicesAccessDenied"),
    };
  }

  if (result.error) {
    return {
      hasData: false,
      emptyTitle: tErrors("loadFailedTitle"),
      emptyDescription: tErrors("invoicesLoadFailed"),
    };
  }

  return { hasData: false, emptyTitle, emptyDescription };
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

function InvoiceCard({
  invoice,
  locale,
  labels,
}: {
  invoice: ClientInvoiceRow;
  locale: AppLocale;
  labels: {
    invoiceLabel: string;
    issueDate: string;
    dueDate: string;
    total: string;
    paid: string;
    due: string;
    lineItems: string;
    quantity: string;
    formatStatus: (key: string) => string;
  };
}) {
  const outstanding = getOutstandingAmount(invoice);
  const showPayButton = canPayInvoice(invoice);

  return (
    <li className="rounded-xl border border-[#1E293B] bg-[#050816]/40 px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-medium text-white">
              {invoice.invoice_number ?? labels.invoiceLabel}
            </h2>
            <StatusBadge
              label={formatStatusLabel(invoice.status, labels.formatStatus)}
              tone={invoiceStatusTone(invoice.status)}
            />
          </div>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#64748B]">
                {labels.issueDate}
              </dt>
              <dd className="mt-0.5 text-[#94A3B8]">
                {formatDate(invoice.issue_date, locale)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#64748B]">
                {labels.dueDate}
              </dt>
              <dd className="mt-0.5 text-[#94A3B8]">
                {formatDate(invoice.due_date, locale)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="shrink-0 sm:text-right">
          <p className="text-xs uppercase tracking-wide text-[#64748B]">{labels.total}</p>
          <p className="mt-0.5 text-lg font-semibold text-white">
            {formatCurrency(invoice.total, invoice.currency, locale)}
          </p>
          <p className="mt-2 text-xs text-[#64748B]">
            {labels.paid}:{" "}
            <span className="text-[#94A3B8]">
              {formatCurrency(invoice.amount_paid, invoice.currency, locale)}
            </span>
          </p>
          {outstanding !== null ? (
            <p className="mt-1 text-xs text-[#64748B]">
              {labels.due}:{" "}
              <span
                className={
                  outstanding > 0 ? "font-medium text-amber-300" : "text-[#94A3B8]"
                }
              >
                {formatCurrency(outstanding, invoice.currency, locale)}
              </span>
            </p>
          ) : null}
        </div>
      </div>

      {invoice.items.length ? (
        <div className="mt-4 border-t border-[#1E293B] pt-4">
          <h3 className="text-xs uppercase tracking-wide text-[#64748B]">
            {labels.lineItems}
          </h3>
          <ul className="mt-2 space-y-2">
            {invoice.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 text-sm text-[#94A3B8]">
                <span>{item.description}</span>
                <span>
                  {item.quantity} × {formatCurrency(item.unit_price, invoice.currency, locale)}
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
  const locale = resolveLocale(await getLocale());
  const t = await getTranslations("invoices");
  const tCommon = await getTranslations("common");
  const tErrors = await getTranslations("errors");
  const tStatus = await getTranslations("status");

  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;

  const dbState = await getDatabaseReadyState();
  const invoicesResult = await getClientInvoices(companyIds);
  const invoices = invoicesResult.data;
  const section = invoiceListSectionMessage(
    invoicesResult,
    tErrors,
    t("emptyTitle"),
    t("emptyDescription"),
  );

  const invoiceLabels = {
    invoiceLabel: t("invoiceLabel"),
    issueDate: tCommon("issueDate"),
    dueDate: tCommon("dueDate"),
    total: tCommon("total"),
    paid: tCommon("paid"),
    due: tCommon("due"),
    lineItems: tCommon("lineItems"),
    quantity: tCommon("quantity"),
    formatStatus: tStatus,
  };

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      {!dbState.configured ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {dbState.message}
        </div>
      ) : null}

      {section.hasData ? (
        <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-4 sm:p-6">
          <ul className="space-y-3">
            {invoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                locale={locale}
                labels={invoiceLabels}
              />
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
