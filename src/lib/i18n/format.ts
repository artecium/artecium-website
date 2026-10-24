import { intlLocale, type AppLocale } from "@/i18n/config";

export function formatDate(value: string | null, locale: AppLocale): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string | null, locale: AppLocale): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatCurrency(
  amount: number | null | undefined,
  currency: string | null | undefined,
  locale: AppLocale,
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  const code = currency?.trim() || "EUR";
  try {
    return new Intl.NumberFormat(intlLocale(locale), {
      style: "currency",
      currency: code,
    }).format(amount);
  } catch {
    return `${amount} ${code}`;
  }
}

export function formatBillingSuffix(
  billingPeriod: string,
  t: (key: string) => string,
): string {
  switch (billingPeriod) {
    case "monthly":
      return t("billing.monthly");
    case "quarterly":
      return t("billing.quarterly");
    case "yearly":
      return t("billing.yearly");
    case "one_time":
      return t("billing.oneTime");
    default:
      return "";
  }
}
