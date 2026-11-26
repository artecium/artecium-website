import type { AppLocale } from "@/i18n/config";

type Messages = Record<string, unknown>;

export async function mergeHomePricingMessages(
  locale: AppLocale,
  base: Messages,
): Promise<Messages> {
  const overlay =
    locale === "en"
      ? (await import("@/i18n/messages/home-pricing/en.json")).default
      : (await import("@/i18n/messages/home-pricing/pt-PT.json")).default;

  const home = (base.home ?? {}) as Record<string, unknown>;
  return {
    ...base,
    home: {
      ...home,
      pricing: overlay.pricing,
    },
  };
}