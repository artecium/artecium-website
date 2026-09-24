export const STRIPE_CHECKOUT_RETURN_PATHS = [
  "/client/invoices/payment/success",
  "/client/invoices/payment/cancel",
] as const;

export function isStripeCheckoutReturnPath(pathname: string): boolean {
  return (STRIPE_CHECKOUT_RETURN_PATHS as readonly string[]).includes(pathname);
}
