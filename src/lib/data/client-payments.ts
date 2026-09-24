import {
  type DataFetchResult,
  fromQueryResult,
  skippedFetchResult,
} from "@/lib/data/supabase-query";
import { createClient } from "@/lib/supabase/server";

export interface ClientPaymentRow {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string | null;
  transaction_reference: string | null;
  provider_payment_id: string | null;
  paid_at: string | null;
  created_at: string;
  invoice_number: string | null;
}

function extractInvoiceNumber(
  invoices: unknown,
): string | null {
  if (!invoices) return null;

  const row = Array.isArray(invoices) ? invoices[0] : invoices;
  if (!row || typeof row !== "object") return null;

  const invoiceNumber = (row as { invoice_number?: string | null }).invoice_number;
  return invoiceNumber ?? null;
}

function mapPaymentRow(row: Record<string, unknown>): ClientPaymentRow {
  return {
    id: row.id as string,
    amount: Number(row.amount ?? 0),
    currency: (row.currency as string) ?? "EUR",
    status: row.status as string,
    provider: (row.provider as string | null) ?? null,
    transaction_reference: (row.transaction_reference as string | null) ?? null,
    provider_payment_id: (row.provider_payment_id as string | null) ?? null,
    paid_at: (row.paid_at as string | null) ?? null,
    created_at: row.created_at as string,
    invoice_number: extractInvoiceNumber(row.invoices),
  };
}

export function getPaymentDisplayDate(payment: ClientPaymentRow): string | null {
  return payment.paid_at ?? payment.created_at;
}

export async function getClientPayments(
  companyIds: string[],
): Promise<DataFetchResult<ClientPaymentRow[]>> {
  if (!companyIds.length) {
    return skippedFetchResult([], "getClientPayments requires companyIds");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select(
      `
      id,
      amount,
      currency,
      status,
      provider,
      transaction_reference,
      provider_payment_id,
      paid_at,
      created_at,
      invoices ( invoice_number )
    `,
    )
    .in("company_id", companyIds)
    .order("paid_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    return fromQueryResult("client-payments.getClientPayments", null, error, []);
  }

  const payments = (data ?? []).map((row) =>
    mapPaymentRow(row as Record<string, unknown>),
  );

  return fromQueryResult("client-payments.getClientPayments", payments, null, []);
}
