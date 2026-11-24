/**
 * Validates portal host/path mapping helpers (no network, no env required).
 *
 * Usage: npm run verify:portal-routing
 */

import {
  normalizePortalPathname,
  isPortalHostname,
  isLocalDevHostname,
  isProductionMainSiteHostname,
  servesClientRoutesOnHost,
  shouldUseExternalPortalNavigation,
  resolveRoutingHost,
  publicPortalPathToInternal,
  internalClientPathToPublic,
  isPortalProtectedPublicPath,
  isPortalLoginPublicPath,
  isPortalRootPublicPath,
  isExcludedFromPortalRouting,
  isPortalStripeCheckoutReturnPublicPath,
  DEFAULT_PORTAL_HOSTNAME,
  portalSameHostRedirectPathname,
  PORTAL_STRIPE_CHECKOUT_RETURN_PUBLIC_PATHS,
} from "../src/lib/routing/portal-host.ts";

function clientAreaHref(internalPath, hostname) {
  const normalized = normalizePortalPathname(internalPath);
  if (isPortalHostname(hostname)) {
    return internalClientPathToPublic(normalized) ?? normalized;
  }
  return normalized;
}

function portalAbsoluteHref(internalPath) {
  const normalized = normalizePortalPathname(internalPath);
  const publicPath = internalClientPathToPublic(normalized) ?? normalized;
  return `https://${DEFAULT_PORTAL_HOSTNAME}${publicPath}`;
}

function clientAreaLinkTarget(internalPath, hostname, nodeEnv) {
  if (shouldUseExternalPortalNavigation(hostname, nodeEnv)) {
    return {
      href: portalAbsoluteHref(internalPath),
      useFullNavigation: true,
    };
  }
  return {
    href: clientAreaHref(internalPath, hostname),
    useFullNavigation: false,
  };
}

function clientAreaPathnameForNavMatch(pathname) {
  return publicPortalPathToInternal(pathname) ?? normalizePortalPathname(pathname);
}

const MAIN_SITE_ADMIN = "https://artecium.com/admin/dashboard";

function postLoginRedirectUrl(internalDestination, hostname) {
  if (internalDestination === "/admin/dashboard") {
    if (isPortalHostname(hostname)) {
      return MAIN_SITE_ADMIN;
    }
    return internalDestination;
  }
  return clientAreaHref("/client/dashboard", hostname);
}

/** @typedef {{ name: string; pass: boolean; detail: string }} CheckResult */

/** @type {CheckResult[]} */
const results = [];

function check(name, condition, detail) {
  results.push({ name, pass: Boolean(condition), detail });
}

function main() {
  check(
    "hostname: portal host",
    isPortalHostname("client.artecium.com") && isPortalHostname("Client.artecium.com:443"),
    DEFAULT_PORTAL_HOSTNAME,
  );
  check(
    "hostname: main site",
    !isPortalHostname("artecium.com"),
    "artecium.com",
  );

  const pairs = [
    ["/dashboard", "/client/dashboard"],
    ["/projects", "/client/projects"],
    ["/projects/123", "/client/projects/123"],
    ["/projects/uuid-here", "/client/projects/uuid-here"],
    ["/invoices", "/client/invoices"],
    ["/invoices/payment/success", "/client/invoices/payment/success"],
    ["/invoices/payment/cancel", "/client/invoices/payment/cancel"],
    ["/services", "/client/services"],
    ["/settings", "/client/settings"],
  ];

  for (const [publicPath, internalPath] of pairs) {
    check(
      `public → internal: ${publicPath}`,
      publicPortalPathToInternal(publicPath) === internalPath,
      publicPortalPathToInternal(publicPath) ?? "null",
    );
    check(
      `internal → public: ${internalPath}`,
      internalClientPathToPublic(internalPath) === publicPath,
      internalClientPathToPublic(internalPath) ?? "null",
    );
    check(
      `round-trip internal: ${internalPath}`,
      publicPortalPathToInternal(internalClientPathToPublic(internalPath) ?? "") ===
        internalPath,
      internalPath,
    );
  }

  check(
    "query stripped",
    publicPortalPathToInternal("/dashboard?x=1") === "/client/dashboard",
    normalizePortalPathname("/dashboard?x=1"),
  );
  check(
    "hash stripped",
    publicPortalPathToInternal("/projects/1#section") === "/client/projects/1",
    normalizePortalPathname("/projects/1#section"),
  );

  check("login not mapped", publicPortalPathToInternal("/login") === null, "null");
  check("root not mapped", publicPortalPathToInternal("/") === null, "null");
  check("is portal root", isPortalRootPublicPath("/"), "/");
  check("is portal login", isPortalLoginPublicPath("/login"), "/login");

  const rejected = [
    "/admin/dashboard",
    "/api/foo",
    "/_next/static/chunk.js",
    "/client/dashboard",
    "/projects/1/extra",
    "/invoices/payment/other",
    "/unknown",
    "/en/dashboard",
  ];

  for (const path of rejected) {
    check(
      `rejected public map: ${path}`,
      publicPortalPathToInternal(path) === null,
      publicPortalPathToInternal(path) ?? "null",
    );
  }

  check(
    "excluded: admin",
    isExcludedFromPortalRouting("/admin/clients"),
    "admin",
  );
  check("excluded: api", isExcludedFromPortalRouting("/api/discovery"), "api");

  check(
    "protected: dashboard",
    isPortalProtectedPublicPath("/dashboard"),
    "true",
  );
  check(
    "not protected: login",
    !isPortalProtectedPublicPath("/login"),
    "login",
  );
  check(
    "not protected: stripe success",
    !isPortalProtectedPublicPath("/invoices/payment/success") &&
      isPortalStripeCheckoutReturnPublicPath("/invoices/payment/success"),
    "stripe return",
  );

  check(
    "portal same-host redirect: client dashboard",
    portalSameHostRedirectPathname("/client/dashboard") === "/dashboard",
    portalSameHostRedirectPathname("/client/dashboard"),
  );
  check(
    "portal same-host redirect: admin unchanged",
    portalSameHostRedirectPathname("/admin/dashboard") === "/admin/dashboard",
    portalSameHostRedirectPathname("/admin/dashboard"),
  );

  check(
    "clientAreaHref: portal host",
    clientAreaHref("/client/projects/abc", "client.artecium.com") ===
      "/projects/abc",
    clientAreaHref("/client/projects/abc", "client.artecium.com"),
  );
  check(
    "clientAreaHref: main site legacy",
    clientAreaHref("/client/dashboard", "artecium.com") === "/client/dashboard",
    clientAreaHref("/client/dashboard", "artecium.com"),
  );
  check(
    "portalAbsoluteHref",
    portalAbsoluteHref("/client/invoices") ===
      "https://client.artecium.com/invoices",
    portalAbsoluteHref("/client/invoices"),
  );
  check(
    "nav match normalizes public pathname",
    clientAreaPathnameForNavMatch("/dashboard") === "/client/dashboard",
    clientAreaPathnameForNavMatch("/dashboard"),
  );

  const [portalSuccessPath, portalCancelPath] =
    PORTAL_STRIPE_CHECKOUT_RETURN_PUBLIC_PATHS;
  const portalStripeSuccess = `https://client.artecium.com${portalSuccessPath}?session_id={CHECKOUT_SESSION_ID}`;
  const portalStripeCancel = `https://client.artecium.com${portalCancelPath}`;
  check(
    "Stripe return: portal success",
    portalStripeSuccess ===
      "https://client.artecium.com/invoices/payment/success?session_id={CHECKOUT_SESSION_ID}",
    portalStripeSuccess,
  );
  check(
    "Stripe return: portal cancel",
    portalStripeCancel === "https://client.artecium.com/invoices/payment/cancel",
    portalStripeCancel,
  );

  const mainStripeSuccess =
    "https://artecium.com/client/invoices/payment/success?session_id={CHECKOUT_SESSION_ID}";
  const mainStripeCancel = "https://artecium.com/client/invoices/payment/cancel";
  check(
    "Stripe return: main success",
    mainStripeSuccess ===
      "https://artecium.com/client/invoices/payment/success?session_id={CHECKOUT_SESSION_ID}",
    mainStripeSuccess,
  );
  check(
    "Stripe return: main cancel",
    mainStripeCancel === "https://artecium.com/client/invoices/payment/cancel",
    mainStripeCancel,
  );

  check(
    "local dev host",
    isLocalDevHostname("localhost:3000") &&
      isLocalDevHostname("127.0.0.1") &&
      servesClientRoutesOnHost("localhost"),
    "localhost serves client routes",
  );
  check(
    "production main host",
    isProductionMainSiteHostname("artecium.com") &&
      isProductionMainSiteHostname("www.artecium.com") &&
      !servesClientRoutesOnHost("artecium.com"),
    "artecium.com uses portal redirect",
  );
  check(
    "preview host serves client locally",
    servesClientRoutesOnHost("my-preview.vercel.app") &&
      !isProductionMainSiteHostname("my-preview.vercel.app"),
    "non-production hosts keep /client on same origin",
  );
  check(
    "IPv6 localhost",
    isLocalDevHostname("[::1]") && servesClientRoutesOnHost("[::1]"),
    "[::1]",
  );

  const localClientLink = clientAreaLinkTarget(
    "/client/dashboard",
    "localhost",
    "development",
  );
  check(
    "AreaHub link localhost internal (dev)",
    localClientLink.href === "/client/dashboard" &&
      localClientLink.useFullNavigation === false,
    JSON.stringify(localClientLink),
  );

  const devMainHostLink = clientAreaLinkTarget(
    "/client/dashboard",
    "artecium.com",
    "development",
  );
  check(
    "AreaHub link artecium.com internal in development",
    devMainHostLink.href === "/client/dashboard" &&
      devMainHostLink.useFullNavigation === false,
    JSON.stringify(devMainHostLink),
  );

  const prodClientLink = clientAreaLinkTarget(
    "/client/dashboard",
    "artecium.com",
    "production",
  );
  check(
    "AreaHub link production external portal",
    prodClientLink.useFullNavigation === true &&
      prodClientLink.href === "https://client.artecium.com/dashboard",
    JSON.stringify(prodClientLink),
  );

  check(
    "shouldUseExternalPortalNavigation dev",
    !shouldUseExternalPortalNavigation("artecium.com", "development") &&
      shouldUseExternalPortalNavigation("artecium.com", "production"),
    "artecium.com dev=false prod=true",
  );
  check(
    "shouldUseExternalPortalNavigation localhost prod node",
    !shouldUseExternalPortalNavigation("localhost", "production"),
    "localhost never external",
  );
  check(
    "resolveRoutingHost prefers local Host",
    resolveRoutingHost("localhost:3000", "artecium.com", "localhost") ===
      "localhost:3000",
    "ignore forwarded prod host on local dev",
  );

  function legacyMainRedirect(pathname, portalBase, search = "", requestHost = "") {
    if (requestHost && isLocalDevHostname(requestHost)) return null;
    const path = normalizePortalPathname(pathname);
    if (!path.startsWith("/client")) return null;
    if (path === "/client/invoices/payment/success" || path === "/client/invoices/payment/cancel") {
      return null;
    }
    let publicPath = path === "/client" ? "/dashboard" : internalClientPathToPublic(path);
    if (!publicPath) return null;
    const base = portalBase.replace(/\/$/, "");
    const url = new URL(publicPath, `${base}/`);
    if (search) url.search = search.startsWith("?") ? search.slice(1) : search;
    return url.href;
  }

  check(
    "legacy main → portal dashboard",
    legacyMainRedirect("/client/dashboard", "https://client.artecium.com") ===
      "https://client.artecium.com/dashboard",
    legacyMainRedirect("/client/dashboard", "https://client.artecium.com"),
  );
  check(
    "legacy main → portal project",
    legacyMainRedirect("/client/projects/abc", "https://client.artecium.com") ===
      "https://client.artecium.com/projects/abc",
    legacyMainRedirect("/client/projects/abc", "https://client.artecium.com"),
  );
  check(
    "legacy main: stripe success not redirected",
    legacyMainRedirect("/client/invoices/payment/success", "https://client.artecium.com") === null,
    "null",
  );
  check(
    "legacy main: query preserved",
    legacyMainRedirect("/client/invoices", "https://client.artecium.com", "?paid=1") ===
      "https://client.artecium.com/invoices?paid=1",
    legacyMainRedirect("/client/invoices", "https://client.artecium.com", "?paid=1"),
  );
  check(
    "legacy main: skipped on localhost",
    legacyMainRedirect("/client/dashboard", "https://client.artecium.com", "", "localhost") ===
      null,
    "null on localhost",
  );

  check(
    "post-login: portal client",
    postLoginRedirectUrl("/client/dashboard", "client.artecium.com") === "/dashboard",
    postLoginRedirectUrl("/client/dashboard", "client.artecium.com"),
  );
  check(
    "post-login: main client",
    postLoginRedirectUrl("/client/dashboard", "artecium.com") === "/client/dashboard",
    postLoginRedirectUrl("/client/dashboard", "artecium.com"),
  );
  check(
    "post-login: portal staff",
    postLoginRedirectUrl("/admin/dashboard", "client.artecium.com") === MAIN_SITE_ADMIN,
    postLoginRedirectUrl("/admin/dashboard", "client.artecium.com"),
  );
  check(
    "post-login: main staff",
    postLoginRedirectUrl("/admin/dashboard", "artecium.com") === "/admin/dashboard",
    postLoginRedirectUrl("/admin/dashboard", "artecium.com"),
  );

  const failed = results.filter((r) => !r.pass);
  for (const r of results) {
    const mark = r.pass ? "PASS" : "FAIL";
    console.log(`${mark}  ${r.name}${r.detail && !r.pass ? ` — ${r.detail}` : ""}`);
  }

  console.log("");
  console.log(`${results.length - failed.length}/${results.length} checks passed`);

  if (failed.length) {
    process.exit(1);
  }
}

main();
