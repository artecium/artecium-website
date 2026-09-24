import { AdminListCard } from "@/components/admin/AdminListCard";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { requireAdminPage } from "@/lib/auth/admin-access";
import { getAdminInvoiceDetail } from "@/lib/data/admin/queries";
import {
  formatCurrency,
  formatDate,
  formatStatusLabel,
} from "@/lib/data/client-format";
import { PERMISSIONS } from "@/types/platform";
import Link from "next/link";
import { notFound } from "next/navigation";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminInvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  await requireAdminPage(PERMISSIONS.INVOICES_VIEW);
  const { id } = await params;
  const detail = await getAdminInvoiceDetail(id);

  if (!detail.invoice) notFound();

  const invoice = detail.invoice as Record<string, unknown>;
  const company = invoice.companies as { name?: string } | { name?: string }[] | null;
  const companyName = Array.isArray(company) ? company[0]?.name : company?.name;

  return (
    <>
      <PageHeader
        title={`Invoice ${invoice.invoice_number as string}`}
        description={companyName ? `Client: ${companyName}` : "Invoice details"}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <StatusBadge label={formatStatusLabel(invoice.status as string)} />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total" value={formatCurrency(Number(invoice.total), invoice.currency as string)} />
        <Stat label="Issued" value={formatDate(invoice.issue_date as string | null)} />
        <Stat label="Due" value={formatDate(invoice.due_date as string | null)} />
        <Stat label="Currency" value={invoice.currency as string} />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-medium text-white">Invoice items</h2>
        {(detail.items as Record<string, unknown>[]).length ? (
          <div className="space-y-3">
            {(detail.items as Record<string, unknown>[]).map((item) => (
              <AdminListCard
                key={item.id as string}
                title={item.description as string}
                subtitle={`Qty ${item.quantity} × ${formatCurrency(Number(item.unit_price), invoice.currency as string)}`}
                meta={
                  <span className="text-sm text-white">
                    {formatCurrency(
                      Number(item.quantity) * Number(item.unit_price),
                      invoice.currency as string,
                    )}
                  </span>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No line items" description="This invoice has no items." />
        )}
      </section>

      <div className="mt-6">
        <Link href="/admin/invoices" className="text-sm text-[#93C5FD] hover:underline">
          ← Back to invoices
        </Link>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-4">
      <p className="text-xs uppercase tracking-wide text-[#64748B]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
