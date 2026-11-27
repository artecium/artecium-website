import { isPrototypeRuntime } from "@/lib/lab/runtime";

/** Supabase local demo anon key — never points at production when URL is a placeholder. */
const PROTOTYPE_PLACEHOLDER_URL = "https://127.0.0.1:54321";
const PROTOTYPE_PLACEHOLDER_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export function resolveSupabasePublicEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

  if (url && anonKey) {
    return { url, anonKey };
  }

  if (isPrototypeRuntime()) {
    return { url: PROTOTYPE_PLACEHOLDER_URL, anonKey: PROTOTYPE_PLACEHOLDER_ANON_KEY };
  }

  return { url, anonKey };
}