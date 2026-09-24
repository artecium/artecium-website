import type { DataFetchResult } from "@/lib/data/supabase-query";

export function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatCurrency(
  amount: number | null | undefined,
  currency?: string | null,
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  const code = currency?.trim() || "EUR";
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: code,
    }).format(amount);
  } catch {
    return `${amount} ${code}`;
  }
}

export function formatStatusLabel(status?: string | null): string {
  if (!status) return "UNKNOWN";
  return status.replace(/_/g, " ").toUpperCase();
}

export function formatBillingSuffix(billingPeriod: string): string {
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

export function listSectionMessage(
  result: Pick<DataFetchResult<unknown[]>, "data" | "error" | "accessDenied" | "skipped">,
  emptyTitle: string,
  emptyDescription: string,
): { hasData: boolean; emptyTitle: string; emptyDescription: string } {
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

  return { hasData: false, emptyTitle, emptyDescription };
}
