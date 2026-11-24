import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { requireBookingSession } from "@/lib/auth/booking-session";
import { listBookingCustomers } from "@/lib/data/booking";
import { getTranslations } from "next-intl/server";

export default async function BookingCustomersPage() {
  const session = await requireBookingSession({ requireBusiness: true });
  const customers = await listBookingCustomers(session.activeBusinessId!, {
    includeInternalNotes: session.canManageActiveBusiness,
  });
  const t = await getTranslations("booking.customers");
  const tCommon = await getTranslations("common");

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      {customers.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1E293B]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#1E293B] bg-[#0E1324]/80 text-[#94A3B8]">
              <tr>
                <th className="px-4 py-3">{tCommon("name")}</th>
                <th className="px-4 py-3">{tCommon("email")}</th>
                <th className="px-4 py-3">{tCommon("phone")}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-[#1E293B]/60">
                  <td className="px-4 py-3 text-white">{c.full_name}</td>
                  <td className="px-4 py-3">{c.email ?? tCommon("emptyDash")}</td>
                  <td className="px-4 py-3">{c.phone ?? tCommon("emptyDash")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
