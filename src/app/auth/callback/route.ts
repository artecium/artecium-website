import { resolveSafePostAuthPathForHost } from "@/lib/auth/login-redirect";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next");
  const safeNext = resolveSafePostAuthPathForHost(requestUrl.hostname, nextParam);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
    }
  }

  const loginUrl = new URL("/login", requestUrl.origin);
  loginUrl.searchParams.set("error", "auth_callback");
  return NextResponse.redirect(loginUrl);
}
