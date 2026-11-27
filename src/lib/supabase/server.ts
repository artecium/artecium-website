import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { resolveSupabasePublicEnv } from "@/lib/supabase/public-env";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = resolveSupabasePublicEnv();

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet, _headers) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — session refresh is handled by proxy.ts
          }
        },
      },
    },
  );
}
