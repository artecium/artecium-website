import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  fetchUserRolesFromSupabase,
  resolveIsStaffFromSupabase,
} from "@/lib/auth/profile-roles";
import { getPostLoginPath } from "@/lib/auth/redirects";
import { hasAnyStaffRole } from "@/lib/auth/permissions";
import { isStripeCheckoutReturnPath } from "@/lib/stripe/checkout-paths";
import type { UserRole } from "@/types/platform";

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach(({ name, value }) => {
    target.cookies.set(name, value);
  });
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

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
          supabaseResponse = NextResponse.next({
            request,
          });
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

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims as { sub?: string } | undefined;
  const userId = claims?.sub;

  const pathname = request.nextUrl.pathname;
  supabaseResponse.headers.set("x-pathname", pathname);

  if (
    !userId &&
    pathname.startsWith("/client") &&
    !isStripeCheckoutReturnPath(pathname)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirectResponse = NextResponse.redirect(url);
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (
    !userId &&
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/login")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    const redirectResponse = NextResponse.redirect(url);
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (userId && (pathname.startsWith("/login") || pathname.startsWith("/admin/login"))) {
    const roles = await resolveRolesFromClaims(supabase, userId);
    const url = request.nextUrl.clone();
    url.pathname = hasAnyStaffRole(roles)
      ? getPostLoginPath(roles)
      : (await resolveIsStaff(supabase, userId, roles))
        ? "/admin/dashboard"
        : "/client/dashboard";
    const redirectResponse = NextResponse.redirect(url);
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (userId && pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const roles = await resolveRolesFromClaims(supabase, userId);
    if (!(await resolveIsStaff(supabase, userId, roles))) {
      const url = request.nextUrl.clone();
      url.pathname = "/client/dashboard";
      const redirectResponse = NextResponse.redirect(url);
      copyCookies(supabaseResponse, redirectResponse);
      return redirectResponse;
    }
  }

  if (userId && pathname.startsWith("/client")) {
    const roles = await resolveRolesFromClaims(supabase, userId);
    if (await resolveIsStaff(supabase, userId, roles)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/dashboard";
      const redirectResponse = NextResponse.redirect(url);
      copyCookies(supabaseResponse, redirectResponse);
      return redirectResponse;
    }
  }

  return supabaseResponse;
}
