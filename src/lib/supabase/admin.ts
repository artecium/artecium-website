import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — SERVER ONLY.
 * Never import this from client components.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) for server-side admin operations.",
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: "artecium-admin",
    },
  });
}
