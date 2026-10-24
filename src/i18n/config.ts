export const LOCALE_COOKIE = "artecium_locale";

export const locales = ["pt-PT", "en"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "pt-PT";

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return value === "pt-PT" || value === "en";
}

export function resolveLocale(value: string | undefined | null): AppLocale {
  return isAppLocale(value) ? value : defaultLocale;
}

export function intlLocale(locale: AppLocale): string {
  return locale === "en" ? "en-GB" : "pt-PT";
}
