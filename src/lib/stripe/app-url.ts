import "server-only";

import { DEFAULT_PORTAL_HOSTNAME } from "../routing/portal-host";

/** Absolute base URL for Stripe Checkout redirects (no trailing slash). */
export function getAppBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

/**
 * Absolute base URL for the client portal host (no trailing slash).
 *
 * Optional override: `NEXT_PUBLIC_PORTAL_APP_URL` (e.g. local dev with a hosts entry
 * for `client.artecium.com`, or a preview deployment). When unset, defaults to
 * `https://{DEFAULT_PORTAL_HOSTNAME}` (`https://client.artecium.com` in production).
 */
export function getPortalBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_PORTAL_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  return `https://${DEFAULT_PORTAL_HOSTNAME}`;
}
