import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  fetchUserRolesFromSupabase,
  resolveIsStaffFromSupabase,
} from "@/lib/auth/profile-roles";
import {
  resolveBookingHostPostLoginPath,
  resolvePostLoginPath,
} from "@/lib/auth/area-access-policy";
import { resolveUserAreaAccess } from "@/lib/auth/area-access-resolve";
import {
  sanitizeBookingHostLoginNext,
  sanitizeLoginNext,
} from "@/lib/auth/login-redirect";
import { getPostLoginPath } from "@/lib/auth/redirects";
import { hasAnyStaffRole } from "@/lib/auth/permissions";
import { SITE_URL } from "@/config/seo";
import {
  bookingPublicPathToInternal,
  isBookingHostname,
  isBookingProtectedAdminPath,
  redirectBookingHostAwayFromPlatformAdmin,
  isLocalDevHostname,
  isPortalHostname,
  isPortalProtectedPublicPath,
  isProductionMainSiteHostname,
  resolveRoutingHost,
  portalSameHostRedirectPathname,
  publicPortalPathToInternal,
  resolveMainSiteLegacyClientPortalUrl,
  resolvePortalLegacyClientPathname,
} from "@/lib/routing";
import { isStripeCheckoutReturnPath } from "@/lib/stripe/checkout-paths";
import { LOCALE_COOKIE, resolveLocale, type AppLocale } from "@/i18n/config";
import {
  isRscFlightRequest,
  logClientRouteDiagnostic,
  redactRedirectTarget,
} from "@/lib/dev/client-route-diagnostic";
import { getPortalBaseUrl } from "@/lib/stripe/app-url";
import type { UserRole } from "@/types/platform";

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach(({ name, value }) => {
    target.cookies.set(name, value);
  });
}

function requestHost(request: NextRequest): string {
  return resolveRoutingHost(
    request.headers.get("host") ?? "",
    request.headers.get("x-forwarded-host"),
    request.nextUrl.hostname,
  );
}

/** Trusted absolute URL on the main site (no user-controlled host). */
function mainSiteUrl(pathname: string, search = ""): URL {
  const url = new URL(pathname, SITE_URL);
  if (search) {
    url.search = search;
  }
  return url;
}

async function resolveRolesFromClaims(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<UserRole[]> {
  return fetchUserRolesFromSupabase(supabase, userId);
}

async function resolveIsStaff(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  roles: UserRole[],
): Promise<boolean> {
  if (hasAnyStaffRole(roles)) {
    return true;
  }

  return resolveIsStaffFromSupabase(supabase, userId);
}

function resolveProxyLocale(
  request: NextRequest,
  usesCookieLocale: boolean,
  pathname: string,
): AppLocale {
  if (usesCookieLocale) {
    return resolveLocale(request.cookies.get(LOCALE_COOKIE)?.value);
  }

  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "pt-PT";
}

function createNextResponse(
  request: NextRequest,
  pathnameForHeader: string | undefined,
  usesCookieLocale: boolean,
) {
  const pathname = pathnameForHeader ?? request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set(
    "x-locale",
    resolveProxyLocale(request, usesCookieLocale, pathname),
  );

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

function redirectWithCookies(
  supabaseResponse: NextResponse,
  url: URL,
  status = 307,
): NextResponse {
  const redirectResponse = NextResponse.redirect(url, status);
  copyCookies(supabaseResponse, redirectResponse);
  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  const publicPathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  if (
    process.env.NODE_ENV === "development" &&
    publicPathname.startsWith("/client")
  ) {
    logClientRouteDiagnostic("proxy-start", {
      pathname: publicPathname,
      isRsc: isRscFlightRequest(request.headers.get("RSC")),
      hostHeader: request.headers.get("host") ?? "",
      forwardedHost: request.headers.get("x-forwarded-host") ?? "",
    });
  }

  const host = requestHost(request);
  const isBooking = isBookingHostname(host);
  const isPortal = !isBooking && isPortalHostname(host);
  const usesCookieLocale = isPortal || isBooking;
  const rewriteTarget = isBooking
    ? bookingPublicPathToInternal(publicPathname)
    : isPortal
      ? publicPortalPathToInternal(publicPathname)
      : null;
  const pathnameForAuth = rewriteTarget ?? publicPathname;
  const pathnameForHeader = rewriteTarget ?? publicPathname;

  let supabaseResponse = createNextResponse(
    request,
    pathnameForHeader,
    usesCookieLocale,
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = createNextResponse(
            request,
            pathnameForHeader,
            usesCookieLocale,
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const userId = authUser?.id;

  const isClientPublicPath = publicPathname.startsWith("/client");
  if (process.env.NODE_ENV === "development" && isClientPublicPath) {
    logClientRouteDiagnostic("proxy-enter", {
      pathname: publicPathname,
      isRsc: isRscFlightRequest(request.headers.get("RSC")),
      hostHeader: request.headers.get("host") ?? "",
      forwardedHost: request.headers.get("x-forwarded-host") ?? "",
      resolvedHost: host,
      hasUser: Boolean(userId),
      isPortal,
      nodeEnv: process.env.NODE_ENV,
    });
  }

  if (isBooking && publicPathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = redirectBookingHostAwayFromPlatformAdmin(publicPathname);
    return redirectWithCookies(supabaseResponse, url, 308);
  }

  if (
    isBooking &&
    !userId &&
    (isBookingProtectedAdminPath(publicPathname) ||
      rewriteTarget?.startsWith("/booking/admin"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const nextPublic =
      publicPathname === "/" ? "/dashboard" : publicPathname;
    url.search = `?next=${encodeURIComponent(nextPublic)}`;
    return redirectWithCookies(supabaseResponse, url);
  }

  if (isPortal && publicPathname.startsWith("/admin")) {
    return redirectWithCookies(
      supabaseResponse,
      mainSiteUrl(publicPathname, search),
    );
  }

  if (
    !isPortal &&
    !isBooking &&
    !isLocalDevHostname(host) &&
    process.env.NODE_ENV !== "development" &&
    isProductionMainSiteHostname(host) &&
    publicPathname.startsWith("/client")
  ) {
    const legacyPortalUrl = resolveMainSiteLegacyClientPortalUrl(
      publicPathname,
      getPortalBaseUrl(),
      search,
      host,
    );
    if (legacyPortalUrl) {
      logClientRouteDiagnostic("proxy-http-redirect", {
        pathname: publicPathname,
        isRsc: isRscFlightRequest(request.headers.get("RSC")),
        status: 308,
        location: redactRedirectTarget(legacyPortalUrl),
      });
      return redirectWithCookies(supabaseResponse, legacyPortalUrl, 308);
    }
  }

  if (isPortal && publicPathname.startsWith("/client")) {
    const publicTarget = resolvePortalLegacyClientPathname(publicPathname);
    if (publicTarget) {
      const url = request.nextUrl.clone();
      url.pathname = publicTarget;
      return redirectWithCookies(supabaseResponse, url, 308);
    }
  }

  if (
    !isBooking &&
    !userId &&
    (publicPathname === "/acesso" || publicPathname === "/en/acesso")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(publicPathname)}`;
    return redirectWithCookies(supabaseResponse, url);
  }

  // `/client/**` auth: `src/app/client/layout.tsx` (`requireClientAuth`) — HTTP
  // redirects here break App Router RSC fetches (`Failed to fetch`).

  if (
    !isBooking &&
    !isPortal &&
    !userId &&
    pathnameForAuth.startsWith("/booking/admin")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathnameForAuth)}`;
    return redirectWithCookies(supabaseResponse, url);
  }

  if (
    isPortal &&
    !userId &&
    isPortalProtectedPublicPath(publicPathname)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return redirectWithCookies(supabaseResponse, url);
  }

  if (
    !isBooking &&
    !userId &&
    publicPathname.startsWith("/admin") &&
    !publicPathname.startsWith("/admin/login")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return redirectWithCookies(supabaseResponse, url);
  }

  if (userId && (publicPathname.startsWith("/login") || publicPathname.startsWith("/admin/login"))) {
    if (isBooking && publicPathname.startsWith("/login")) {
      const explicitNext = sanitizeBookingHostLoginNext(
        request.nextUrl.searchParams.get("next"),
      );
      const areaAccess = await resolveUserAreaAccess(supabase, userId);
      const url = request.nextUrl.clone();
      url.pathname =
        explicitNext ??
        (areaAccess
          ? resolveBookingHostPostLoginPath(areaAccess)
          : "/dashboard");
      url.search = "";
      return redirectWithCookies(supabaseResponse, url);
    }

    const explicitNext = sanitizeLoginNext(request.nextUrl.searchParams.get("next"));
    if (explicitNext && publicPathname.startsWith("/login")) {
      const url = request.nextUrl.clone();
      url.pathname = explicitNext;
      url.search = "";
      return redirectWithCookies(supabaseResponse, url);
    }

    const roles = await resolveRolesFromClaims(supabase, userId);
    const areaAccess = await resolveUserAreaAccess(supabase, userId);
    let targetPath = areaAccess
      ? resolvePostLoginPath(areaAccess)
      : hasAnyStaffRole(roles)
        ? getPostLoginPath(roles)
        : (await resolveIsStaff(supabase, userId, roles))
          ? "/admin/dashboard"
          : "/acesso";

    if (isPortal) {
      if (targetPath.startsWith("/admin")) {
        return redirectWithCookies(
          supabaseResponse,
          mainSiteUrl(targetPath, search),
        );
      }
      if (targetPath.startsWith("/client")) {
        targetPath = portalSameHostRedirectPathname(targetPath);
      } else if (targetPath === "/acesso") {
        targetPath = "/acesso";
      }
      const url = request.nextUrl.clone();
      url.pathname = targetPath;
      return redirectWithCookies(supabaseResponse, url);
    }

    const url = request.nextUrl.clone();
    url.pathname = targetPath;
    return redirectWithCookies(supabaseResponse, url);
  }

  if (
    !isBooking &&
    userId &&
    pathnameForAuth.startsWith("/admin") &&
    !pathnameForAuth.startsWith("/admin/login")
  ) {
    const roles = await resolveRolesFromClaims(supabase, userId);
    if (!(await resolveIsStaff(supabase, userId, roles))) {
      const url = request.nextUrl.clone();
      url.pathname = isPortal
        ? portalSameHostRedirectPathname("/client/dashboard")
        : "/client/dashboard";
      return redirectWithCookies(supabaseResponse, url);
    }
  }

  if (rewriteTarget) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = rewriteTarget;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", rewriteTarget);
    requestHeaders.set(
      "x-locale",
      resolveProxyLocale(request, usesCookieLocale, publicPathname),
    );

    const rewriteResponse = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
    copyCookies(supabaseResponse, rewriteResponse);
    return rewriteResponse;
  }

  if (process.env.NODE_ENV === "development" && isClientPublicPath) {
    logClientRouteDiagnostic("proxy-pass", {
      pathname: publicPathname,
      isRsc: isRscFlightRequest(request.headers.get("RSC")),
      hasUser: Boolean(userId),
    });
  }

  return supabaseResponse;
}
