import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

export const NON_PAYABLE_INVOICE_STATUSES = new Set([
  "paid",
  "cancelled",
  "refunded",
]);

export interface PayableInvoiceRow {
  id: string;
  company_id: string;
  invoice_number: string | null;
  status: string;
  total: number | null;
  amount_paid: number;
  currency: string;
}

export function computeInvoiceAmountDue(invoice: PayableInvoiceRow): number | null {
  if (invoice.total === null) return null;
  const due = Number(invoice.total) - Number(invoice.amount_paid ?? 0);
  if (due <= 0) return null;
  return Math.round(due * 100) / 100;
}

export function assertInvoicePayable(invoice: PayableInvoiceRow): number {
  if (NON_PAYABLE_INVOICE_STATUSES.has(invoice.status)) {
    throw new Error("This invoice cannot be paid.");
  }

  const amountDue = computeInvoiceAmountDue(invoice);
  if (amountDue === null || amountDue <= 0) {
    throw new Error("This invoice has no outstanding balance.");
  }

  return amountDue;
}

export async function resolveStripeCustomerForCompany(
  stripe: Stripe,
  params: { companyId: string; email: string; companyName: string },
): Promise<string> {
  const admin = createAdminClient();

  const { data: existing, error: lookupError } = await admin
    .from("company_payment_providers")
    .select("provider_customer_id")
    .eq("company_id", params.companyId)
    .eq("provider", "stripe")
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);
  if (existing?.provider_customer_id) return existing.provider_customer_id as string;

  const customer = await stripe.customers.create(
    { email: params.email, name: params.companyName, metadata: { company_id: params.companyId } },
    { idempotencyKey: `stripe-customer-${params.companyId}` },
  );

  const { error: upsertError } = await admin.from("company_payment_providers").upsert(
    {
      company_id: params.companyId,
      provider: "stripe",
      provider_customer_id: customer.id,
      is_default: true,
      metadata: { source: "invoice_checkout" },
    },
    { onConflict: "company_id,provider" },
  );

  if (upsertError) throw new Error(upsertError.message);
  return customer.id;
}
