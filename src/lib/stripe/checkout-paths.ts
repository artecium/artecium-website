import { PORTAL_STRIPE_CHECKOUT_RETURN_PUBLIC_PATHS } from "../routing/portal-host";

/** Internal App Router paths (main-site legacy URLs and post-rewrite `x-pathname`). */
export const STRIPE_CHECKOUT_RETURN_PATHS = [
  "/client/invoices/payment/success",
  "/client/invoices/payment/cancel",
] as const;

const INTERNAL_SUCCESS = STRIPE_CHECKOUT_RETURN_PATHS[0];
const INTERNAL_CANCEL = STRIPE_CHECKOUT_RETURN_PATHS[1];

const PORTAL_PUBLIC_SUCCESS = PORTAL_STRIPE_CHECKOUT_RETURN_PUBLIC_PATHS[0];
const PORTAL_PUBLIC_CANCEL = PORTAL_STRIPE_CHECKOUT_RETURN_PUBLIC_PATHS[1];

export function isStripeCheckoutReturnPath(pathname: string): boolean {
  return (STRIPE_CHECKOUT_RETURN_PATHS as readonly string[]).includes(pathname);
}

export interface InvoiceCheckoutReturnUrls {
  successUrl: string;
  cancelUrl: string;
}

/**
 * Stripe Checkout success/cancel URLs for invoice payments.
 * Portal host uses public paths; main site keeps internal `/client/...` paths.
 */
export function buildInvoiceCheckoutReturnUrls(
  baseUrl: string,
  usePortalPublicPaths: boolean,
): InvoiceCheckoutReturnUrls {
  const base = baseUrl.replace(/\/$/, "");

  if (usePortalPublicPaths) {
    return {
      successUrl: `${base}${PORTAL_PUBLIC_SUCCESS}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${base}${PORTAL_PUBLIC_CANCEL}`,
    };
  }

  return {
    successUrl: `${base}${INTERNAL_SUCCESS}?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}${INTERNAL_CANCEL}`,
  };
}
