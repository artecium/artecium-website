import { defaultLocale, type AppLocale } from "@/i18n/config";
import {
  formatBillingSuffix as formatBillingSuffixForLocale,
  formatCurrency as formatCurrencyForLocale,
  formatDate as formatDateForLocale,
  formatDateTime as formatDateTimeForLocale,
} from "@/lib/i18n/format";
import { listSectionMessage as listSectionMessageI18n } from "@/lib/i18n/sections";
import { translateStatus } from "@/lib/i18n/status";
import type { DataFetchResult } from "@/lib/data/supabase-query";

export function formatDate(
  value: string | null,
  locale: AppLocale = defaultLocale,
): string {
  return formatDateForLocale(value, locale);
}

export function formatDateTime(
  value: string | null,
  locale: AppLocale = defaultLocale,
): string {
  return formatDateTimeForLocale(value, locale);
}

export function formatCurrency(
  amount: number | null | undefined,
  currency?: string | null,
  locale: AppLocale = defaultLocale,
): string {
  return formatCurrencyForLocale(amount, currency, locale);
}

export function formatBillingSuffix(
  billingPeriod: string,
  t?: (key: string) => string,
): string {
  if (t) {
    return formatBillingSuffixForLocale(billingPeriod, t);
  }

  switch (billingPeriod) {
    case "monthly":
      return "/month";
    case "quarterly":
      return "/quarter";
    case "yearly":
      return "/year";
    case "one_time":
      return " one-time";
    default:
      return "";
  }
}

export function formatStatusLabel(
  status?: string | null,
  t?: (key: string) => string,
): string {
  if (t) {
    return translateStatus(status, t);
  }

  if (!status) return "UNKNOWN";
  return status.replace(/_/g, " ").toUpperCase();
}

export function listSectionMessage(
  result: Pick<DataFetchResult<unknown[]>, "data" | "error" | "accessDenied" | "skipped">,
  emptyTitleOrErrorsTranslator: string | ((key: string) => string),
  emptyDescription?: string,
  emptyTitleKey?: string,
): { hasData: boolean; emptyTitle: string; emptyDescription: string } {
  if (typeof emptyTitleOrErrorsTranslator === "function") {
    return listSectionMessageI18n(
      result,
      emptyTitleOrErrorsTranslator,
      emptyDescription ?? "",
      emptyTitleKey ?? "",
    );
  }

  const emptyTitle = emptyTitleOrErrorsTranslator;

  if (result.data.length > 0) {
    return { hasData: true, emptyTitle: "", emptyDescription: "" };
  }

  if (result.skipped) {
    return {
      hasData: false,
      emptyTitle: "Company context unavailable",
      emptyDescription:
        "Your account is not linked to a company yet, so this section cannot load data.",
    };
  }

  if (result.accessDenied) {
    return {
      hasData: false,
      emptyTitle: "Unable to load data",
      emptyDescription:
        "Access to this section was denied. Contact support if this persists.",
    };
  }

  if (result.error) {
    return {
      hasData: false,
      emptyTitle: "Unable to load data",
      emptyDescription: "Something went wrong while loading this section.",
    };
  }

  return { hasData: false, emptyTitle, emptyDescription: emptyDescription ?? "" };
}
