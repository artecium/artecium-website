import type { AppLocale } from "@/i18n/config";
import type { CommercialAmount } from "@/lib/pricing/commercial-catalog";

const ptNumber = new Intl.NumberFormat("pt-PT", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const enNumber = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatEurAmount(locale: AppLocale, eur: number): string {
  const n = locale === "en" ? enNumber.format(eur) : ptNumber.format(eur);
  return locale === "en" ? `€${n}` : `${n} €`;
}

export function formatCommercialSetup(
  locale: AppLocale,
  amount: CommercialAmount,
): string {
  switch (amount.kind) {
    case "fixed":
      return formatEurAmount(locale, amount.eur);
    case "from":
      return locale === "en"
        ? `From ${formatEurAmount(locale, amount.eur)}`
        : `Desde ${formatEurAmount(locale, amount.eur)}`;
    case "included":
      return locale === "en" ? "Included" : "Incluída";
    case "custom":
      return locale === "en" ? "Custom" : "Personalizada";
    case "none":
      return "—";
    default:
      return "—";
  }
}

export function formatCommercialMonthly(
  locale: AppLocale,
  amount: CommercialAmount,
): string | null {
  switch (amount.kind) {
    case "fixed":
      return locale === "en"
        ? `${formatEurAmount(locale, amount.eur)}/month`
        : `${formatEurAmount(locale, amount.eur)}/mês`;
    case "from":
      return locale === "en"
        ? `From ${formatEurAmount(locale, amount.eur)}/month`
        : `Desde ${formatEurAmount(locale, amount.eur)}/mês`;
    case "none":
      return null;
    case "included":
    case "custom":
      return null;
    default:
      return null;
  }
}

export function formatCommercialMonthlyShort(
  locale: AppLocale,
  amount: CommercialAmount,
): string {
  if (amount.kind === "none") {
    return locale === "en" ? "No monthly fee" : "Sem mensalidade";
  }
  const formatted = formatCommercialMonthly(locale, amount);
  return formatted ?? "—";
}

export function formatSetupAndMonthlyLine(
  locale: AppLocale,
  setup: CommercialAmount,
  monthly: CommercialAmount,
): string {
  const setupStr = formatCommercialSetup(locale, setup);
  const monthlyStr = formatCommercialMonthly(locale, monthly);
  if (!monthlyStr) {
    return setupStr;
  }
  return locale === "en"
    ? `${setupStr} + ${monthlyStr}`
    : `${setupStr} + ${monthlyStr}`;
}