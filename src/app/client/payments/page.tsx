import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import {
  getClientPayments,
  getPaymentDisplayDate,
  type ClientPaymentRow,
} from "@/lib/data/client-payments";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatStatusLabel,
  listSectionMessage,
} from "@/lib/data/client-format";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { requireClientAuth } from "@/lib/auth/session";

function paymentStatusTone(
  status: string,
): "default" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "succeeded":
      return "success";
    case "pending":
    case "processing":
      return "info";
    case "failed":
      return "danger";
    case "partially_refunded":
    case "refunded":
      return "warning";
    case "cancelled":
      return "default";
    default:
      return "default";
  }
}

function PaymentCard({ payment }: { payment: ClientPaymentRow }) {
  const paymentDate = getPaymentDisplayDate(payment);
  const reference =
    payment.transaction_reference ?? payment.provider_payment_id;

  return (
    <li className="rounded-xl border border-[#1E293B] bg-[#050816]/40 px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-lg font-semibold text-white">
              {formatCurrency(payment.amount, payment.currency)}
            </p>
            <StatusBadge
              label={formatStatusLabel(payment.status)}
              tone={paymentStatusTone(payment.status)}
            />
          </div>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {payment.invoice_number ? (
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#64748B]">
                  Invoice
                </dt>
                <dd className="mt-0.5 text-[#94A3B8]">{payment.invoice_number}</dd>
              </div>
            ) : null}

            <div>
              <dt className="text-xs uppercase tracking-wide text-[#64748B]">
                Payment date
              </dt>
              <dd className="mt-0.5 text-[#94A3B8]">
                {formatDateTime(paymentDate)}
              </dd>
            </div>

            {payment.provider ? (
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#64748B]">
                  Provider
                </dt>
                <dd className="mt-0.5 text-[#94A3B8]">{payment.provider}</dd>
              </div>
            ) : null}

            {reference ? (
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-[#64748B]">
                  Reference
                </dt>
                <dd className="mt-0.5 break-all text-[#94A3B8]">{reference}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="shrink-0 text-sm text-[#64748B] sm:text-right">
          <p className="text-xs uppercase tracking-wide">Recorded</p>
          <p className="mt-0.5 text-[#94A3B8]">{formatDate(payment.created_at)}</p>
        </div>
      </div>
    </li>
  );
}

export default async function ClientPaymentsPage() {
  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;

  const dbState = await getDatabaseReadyState();
  const paymentsResult = await getClientPayments(companyIds);
  const section = listSectionMessage(
    paymentsResult,
    "No payments recorded yet",
    "Your payment history will appear here once payments are recorded.",
  );

  return (
    <>
      <PageHeader
        title="Payments"
        description="Payment history, upcoming charges, and billing status."
      />

      {!dbState.configured ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {dbState.message}
        </div>
      ) : null}

      {section.hasData ? (
        <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-4 sm:p-6">
          <ul className="space-y-3">
            {paymentsResult.data.map((payment) => (
              <PaymentCard key={payment.id} payment={payment} />
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
