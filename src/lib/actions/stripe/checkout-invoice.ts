"use server";

import { requireClientAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getAppBaseUrl } from "@/lib/stripe/app-url";
import {
  assertInvoicePayable,
  resolveStripeCustomerForCompany,
  type PayableInvoiceRow,
} from "@/lib/stripe/invoice-checkout";
import { getStripeServerClient } from "@/lib/stripe/server";

export interface CreateInvoiceCheckoutResult {
  url: string;
}

export async function createInvoiceCheckoutSession(
  invoiceId: string,
): Promise<CreateInvoiceCheckoutResult> {
  if (!invoiceId?.trim()) {
    throw new Error("Invoice id is required.");
  }

  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;

  if (!companyIds.length) {
    throw new Error("Your account is not linked to a company.");
  }

  const supabase = await createClient();
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, company_id, invoice_number, status, total, amount_paid, currency")
    .eq("id", invoiceId)
    .in("company_id", companyIds)
    .maybeSingle();

  if (invoiceError) {
    throw new Error(invoiceError.message);
  }

  if (!invoice) {
    throw new Error("Invoice not found or access denied.");
  }

  const payableInvoice = invoice as PayableInvoiceRow;
  const amountDue = assertInvoicePayable(payableInvoice);
  const amountDueCents = Math.round(amountDue * 100);

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("name")
    .eq("id", payableInvoice.company_id)
    .maybeSingle();

  if (companyError) {
    throw new Error(companyError.message);
  }

  const stripe = getStripeServerClient();

  const customerId = await resolveStripeCustomerForCompany(stripe, {
    companyId: payableInvoice.company_id,
    email: session.profile.email,
    companyName: (company?.name as string) ?? "Artecium Client",
  });

  const baseUrl = getAppBaseUrl();
  const currency = (payableInvoice.currency ?? "EUR").toLowerCase();
  const label = payableInvoice.invoice_number ?? payableInvoice.id;

  const checkoutSession = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer: customerId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amountDueCents,
            product_data: {
              name: `Invoice ${label}`,
              description: `Payment for invoice ${label}`,
            },
          },
        },
      ],
      metadata: {
        company_id: payableInvoice.company_id,
        invoice_id: payableInvoice.id,
      },
      success_url: `${baseUrl}/client/invoices/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/client/invoices/payment/cancel`,
    },
    {
      idempotencyKey: `invoice-checkout-${payableInvoice.id}-${amountDueCents}`,
    },
  );

  if (!checkoutSession.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  return { url: checkoutSession.url };
}
