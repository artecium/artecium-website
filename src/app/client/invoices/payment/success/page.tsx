import { PageHeader } from "@/components/platform/PageHeader";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function InvoicePaymentSuccessPage() {
  return (
    <>
      <PageHeader
        title="Pagamento submetido"
        description="O seu pagamento foi enviado ao Stripe Checkout."
      />

      <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6 text-sm text-[#94A3B8]">
        <p>
          O pagamento foi submetido com sucesso. O estado da fatura será atualizado
          automaticamente assim que o Stripe confirmar o pagamento.
        </p>
        <p className="mt-3">
          Isto pode demorar alguns segundos. Pode voltar à lista de faturas para
          verificar o estado atualizado.
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
