import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeServerClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Add it to .env.local (use a restricted key in production).",
    );
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      typescript: true,
    });
  }

  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not configured. Add it to .env.local.",
    );
  }
  return secret;
}
