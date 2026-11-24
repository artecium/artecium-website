import { logClientRouteBeacon } from "@/lib/dev/client-route-diagnostic";
import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/client")) {
    logClientRouteBeacon(
      `proxy.ts HIT ${request.method} ${pathname} rsc=${request.headers.get("RSC") ?? "0"}`,
    );
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
