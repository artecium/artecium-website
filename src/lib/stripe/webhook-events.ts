/** Stripe events we acknowledge but do not sync (Checkout fulfillment uses session events). */
const IGNORED_EVENT_PREFIXES = ["payment_intent.", "charge.", "customer."] as const;

const IGNORED_EVENT_TYPES = new Set([
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.created",
  "charge.succeeded",
  "charge.updated",
]);

export function isIgnorableStripeWebhookEvent(eventType: string): boolean {
  if (IGNORED_EVENT_TYPES.has(eventType)) return true;
  return IGNORED_EVENT_PREFIXES.some((prefix) => eventType.startsWith(prefix));
}
