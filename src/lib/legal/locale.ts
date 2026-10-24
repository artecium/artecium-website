import { headers } from "next/headers";
import type { AppLocale } from "@/i18n/config";

export async function getPathnameFromHeaders(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-pathname") ??
    headersList.get("x-middleware-request-x-pathname") ??
    ""
  );
}

export async function getLocaleFromHeaders(): Promise<AppLocale | null> {
  const headersList = await headers();
  const locale = headersList.get("x-locale");
  if (locale === "en" || locale === "pt-PT") {
    return locale;
  }
  return null;
}

export function resolveLegalLocaleFromPath(pathname: string): AppLocale {
  return pathname.startsWith("/en") ? "en" : "pt-PT";
}

export async function getLegalLocaleFromPath(): Promise<AppLocale> {
  const pathname = await getPathnameFromHeaders();
  return resolveLegalLocaleFromPath(pathname);
}
