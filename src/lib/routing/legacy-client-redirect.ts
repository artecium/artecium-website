import { isStripeCheckoutReturnPath } from "@/lib/stripe/checkout-paths";
import {
  internalClientPathToPublic,
  isLocalDevHostname,
  normalizePortalPathname,
} from "./portal-host";

/**
 * Permanent redirect target for legacy `artecium.com/client/...` URLs.
 * Returns `null` when the path must keep serving on the main host (Stripe returns)
 * or is not a known portal route.
 */
export function resolveMainSiteLegacyClientPortalUrl(
  pathname: string,
  portalBaseUrl: string,
  search = "",
  requestHost = "",
): URL | null {
  if (requestHost && isLocalDevHostname(requestHost)) {
    return null;
  }

  const path = normalizePortalPathname(pathname);

  if (!path.startsWith("/client")) {
    return null;
  }

  if (isStripeCheckoutReturnPath(path)) {
    return null;
  }

  let publicPath: string | null = null;

  if (path === "/client") {
    publicPath = "/dashboard";
  } else {
    publicPath = internalClientPathToPublic(path);
  }

  if (!publicPath) {
    return null;
  }

  const base = portalBaseUrl.replace(/\/$/, "");
  const url = new URL(publicPath, `${base}/`);
  if (search) {
    url.search = search.startsWith("?") ? search.slice(1) : search;
  }
  return url;
}

/**
 * Same-host cleanup: `client.artecium.com/client/...` → public portal paths.
 */
export function resolvePortalLegacyClientPathname(pathname: string): string | null {
  const path = normalizePortalPathname(pathname);

  if (!path.startsWith("/client")) {
    return null;
  }

  if (isStripeCheckoutReturnPath(path)) {
    return null;
  }

  if (path === "/client") {
    return "/dashboard";
  }

  const publicPath = internalClientPathToPublic(path);
  if (!publicPath || publicPath === path) {
    return null;
  }

  return publicPath;
}
