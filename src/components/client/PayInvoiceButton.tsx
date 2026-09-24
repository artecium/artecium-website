"use client";

import { createInvoiceCheckoutSession } from "@/lib/actions/stripe/checkout-invoice";
import { useState } from "react";

interface PayInvoiceButtonProps {
  invoiceId: string;
}

export function PayInvoiceButton({ invoiceId }: PayInvoiceButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);

    try {
      const result = await createInvoiceCheckoutSession(invoiceId);
      window.location.href = result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 border-t border-[#1E293B] pt-4">
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "A redirecionar…" : "Pagar agora"}
      </button>
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
