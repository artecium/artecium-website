import { PageHeader } from "@/components/platform/PageHeader";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function InvoicePaymentCancelPage() {
  return (
    <>
      <PageHeader
        title="Pagamento cancelado"
        description="Não foi efetuado nenhum pagamento."
      />

      <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6 text-sm text-[#94A3B8]">
        <p>
          O pagamento foi cancelado antes de ser concluído. A fatura continua por
          pagar e pode tentar novamente quando quiser.
        </p>
        <Link
          href="/client/invoices"
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-[#334155] px-4 py-2 text-sm font-medium text-white transition hover:border-violet-500 hover:text-violet-200"
        >
          Voltar às faturas
        </Link>
      </div>
    </>
  );
}
