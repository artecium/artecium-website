import { cookies } from "next/headers";
import { LOCALE_COOKIE, resolveLocale, type AppLocale } from "@/i18n/config";
import { getLocaleFromHeaders, getPathnameFromHeaders } from "@/lib/legal/locale";

export function resolveLocaleFromPathname(
  pathname: string,
  cookieLocale: AppLocale,
): AppLocale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : cookieLocale;
}

export async function resolveRequestLocale(): Promise<AppLocale> {
  const headerLocale = await getLocaleFromHeaders();
  if (headerLocale) {
    return headerLocale;
  }

  const pathname = await getPathnameFromHeaders();
  const cookieStore = await cookies();
  const cookieLocale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);

  return resolveLocaleFromPathname(pathname, cookieLocale);
}
