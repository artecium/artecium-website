import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { parseArteciumCheckoutMetadata } from "@/lib/stripe/webhook-metadata";
import type Stripe from "stripe";

function resolvePaymentIntentId(session: Stripe.Checkout.Session): string | null {
  const pi = session.payment_intent;
  if (!pi) return null;
  return typeof pi === "string" ? pi : pi.id;
}

function resolveChargeId(paymentIntent: Stripe.PaymentIntent | null): string | null {
  if (!paymentIntent?.latest_charge) return null;
  return typeof paymentIntent.latest_charge === "string"
    ? paymentIntent.latest_charge
    : paymentIntent.latest_charge.id;
}

function mapCheckoutPaymentStatus(paymentStatus: Stripe.Checkout.Session.PaymentStatus): string {
  switch (paymentStatus) {
    case "paid":
      return "succeeded";
    case "unpaid":
      return "processing";
    default:
      return "pending";
  }
}

export type CheckoutSyncResult =
  | { status: "synced" }
  | { status: "skipped"; reason: string };

export async function syncCheckoutSessionToSupabase(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
): Promise<CheckoutSyncResult> {
  const metadata = parseArteciumCheckoutMetadata(session.metadata);

  if (!metadata) {
    return {
      status: "skipped",
      reason: "missing_or_invalid_arotecium_metadata",
    };
  }

  const { companyId, invoiceId } = metadata;
  const admin = createAdminClient();

  const { data: invoice, error: invoiceError } = await admin
    .from("invoices")
    .select("id, company_id, total, amount_paid, currency, status")
    .eq("id", invoiceId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (invoiceError) {
    throw new Error(invoiceError.message);
  }

  if (!invoice) {
    return {
      status: "skipped",
      reason: "invoice_not_found",
    };
  }

  const sessionId = session.id;

  if (invoice.status === "paid") {
    const { data: existingPaidSessionPayment } = await admin
      .from("payments")
      .select("id, status")
      .eq("transaction_reference", sessionId)
      .maybeSingle();

    if (existingPaidSessionPayment?.status === "succeeded") {
      return { status: "synced" };
    }

    return {
      status: "skipped",
      reason: "invoice_already_paid",
    };
  }

  const paymentIntentId = resolvePaymentIntentId(session);

  let paymentIntent: Stripe.PaymentIntent | null = null;
  if (paymentIntentId) {
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      console.warn(
        `Stripe webhook: unable to retrieve PaymentIntent ${paymentIntentId}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  const amount = (session.amount_total ?? 0) / 100;
  const currency = (session.currency ?? invoice.currency ?? "eur").toUpperCase();
  const isPaid = session.payment_status === "paid";
  const paymentStatus = mapCheckoutPaymentStatus(session.payment_status);

  const { data: existingPayment } = await admin
    .from("payments")
    .select("id, status, amount")
    .eq("transaction_reference", sessionId)
    .maybeSingle();

  const paymentPayload = {
    company_id: companyId,
    invoice_id: invoiceId,
    amount,
    currency,
    status: paymentStatus,
    provider: "stripe",
    provider_payment_id: resolveChargeId(paymentIntent),
    provider_payment_intent_id: paymentIntentId,
    transaction_reference: sessionId,
    paid_at: isPaid ? new Date().toISOString() : null,
    metadata: {
      stripe_checkout_session_id: sessionId,
      stripe_payment_status: session.payment_status,
      stripe_payment_intent_id: paymentIntentId,
    },
    updated_at: new Date().toISOString(),
  };

  if (existingPayment) {
    if (existingPayment.status === "succeeded" && isPaid) {
      return { status: "synced" };
    }

    const { error: updatePaymentError } = await admin
      .from("payments")
      .update(paymentPayload)
      .eq("id", existingPayment.id as string);

    if (updatePaymentError) {
      throw new Error(updatePaymentError.message);
    }
  } else {
    const { error: insertPaymentError } = await admin.from("payments").insert(paymentPayload);

    if (insertPaymentError) {
      throw new Error(insertPaymentError.message);
    }
  }

  if (!isPaid) {
    return { status: "synced" };
  }

  const currentPaid = Number(invoice.amount_paid ?? 0);
  const invoiceTotal = Number(invoice.total ?? 0);
  const newAmountPaid = Math.min(currentPaid + amount, invoiceTotal || currentPaid + amount);
  const fullyPaid = invoiceTotal > 0 ? newAmountPaid >= invoiceTotal : true;

  const { error: updateInvoiceError } = await admin
    .from("invoices")
    .update({
      amount_paid: newAmountPaid,
      paid_at: fullyPaid ? new Date().toISOString() : null,
      status: fullyPaid ? "paid" : "partially_paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  if (updateInvoiceError) {
    throw new Error(updateInvoiceError.message);
  }

  return { status: "synced" };
}

export async function markCheckoutSessionPaymentFailed(
  session: Stripe.Checkout.Session,
): Promise<CheckoutSyncResult> {
  const metadata = parseArteciumCheckoutMetadata(session.metadata);

  if (!metadata) {
    return {
      status: "skipped",
      reason: "missing_or_invalid_arotecium_metadata",
    };
  }

  const sessionId = session.id;
  const admin = createAdminClient();

  const { data: existingPayment } = await admin
    .from("payments")
    .select("id, status")
    .eq("transaction_reference", sessionId)
    .maybeSingle();

  if (!existingPayment) {
    return {
      status: "skipped",
      reason: "payment_not_found",
    };
  }

  if (existingPayment.status === "succeeded") {
    return { status: "synced" };
  }

  const { error } = await admin
    .from("payments")
    .update({
      status: "failed",
      failure_message: "Asynchronous payment failed.",
      metadata: {
        stripe_checkout_session_id: sessionId,
        stripe_payment_status: session.payment_status,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", existingPayment.id as string);

  if (error) {
    throw new Error(error.message);
  }

  return { status: "synced" };
}
