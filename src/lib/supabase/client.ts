import { createBrowserClient } from "@supabase/ssr";
import { resolveSupabasePublicEnv } from "@/lib/supabase/public-env";

export function createClient() {
  const { url, anonKey } = resolveSupabasePublicEnv();
  return createBrowserClient(url, anonKey);
}
