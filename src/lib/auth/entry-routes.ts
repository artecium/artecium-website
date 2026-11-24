/** Public sign-in / sign-up page (shared Supabase Auth). */
export const PUBLIC_AUTH_ENTRY_PATH = "/login";

export function areaHubPath(locale: "en" | "pt-PT"): string {
  return locale === "en" ? "/en/acesso" : "/acesso";
}
