import { PageHeader } from "@/components/platform/PageHeader";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InvoicePaymentSuccessPage() {
  const t = await getTranslations("invoices");
  const tCommon = await getTranslations("common");

  return (
    <>
      <PageHeader
        title={t("paymentSuccessTitle")}
        description={t("paymentSuccessDescription")}
      />

      <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6 text-sm text-[#94A3B8]">
        <p>{t("paymentSuccessBody")}</p>
        <p className="mt-3">{t("paymentSuccessNote")}</p>
        <Link
          href="/client/invoices"
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-[#334155] px-4 py-2 text-sm font-medium text-white transition hover:border-violet-500 hover:text-violet-200"
        >
          {tCommon("backToInvoices")}
        </Link>
      </div>
    </>
  );
}
