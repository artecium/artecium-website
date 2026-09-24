import {
  markCheckoutSessionPaymentFailed,
  syncCheckoutSessionToSupabase,
  type CheckoutSyncResult,
} from "@/lib/stripe/sync-checkout-session";
import { isIgnorableStripeWebhookEvent } from "@/lib/stripe/webhook-events";
import { getStripeServerClient, getStripeWebhookSecret } from "@/lib/stripe/server";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

function webhookResponse(result: CheckoutSyncResult | { ignored: string }) {
  if ("ignored" in result) {
    return NextResponse.json({ received: true, ignored: result.ignored });
  }

  if (result.status === "skipped") {
    console.info(`Stripe webhook skipped: ${result.reason}`);
    return NextResponse.json({ received: true, skipped: result.reason });
  }

  return NextResponse.json({ received: true, synced: true });
}

/**
 * Stripe webhook entry point.
 * Fulfillment and Supabase sync belong here — not on checkout success pages.
 */
export async function POST(request: Request) {
  let eventType = "unknown";

  try {
    const stripe = getStripeServerClient();
    const webhookSecret = getStripeWebhookSecret();

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
    }

    const payload = await request.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid webhook signature.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    eventType = event.type;

    if (isIgnorableStripeWebhookEvent(event.type)) {
      return webhookResponse({ ignored: event.type });
    }

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const result = await syncCheckoutSessionToSupabase(session, stripe);
        return webhookResponse(result);
      }
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const result = await markCheckoutSessionPaymentFailed(session);
        return webhookResponse(result);
      }
      default:
        return NextResponse.json({ received: true, unhandled: event.type });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed.";
    console.error(`Stripe webhook ${eventType} failed:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
