export function translateStatus(
  status: string | null | undefined,
  t: (key: string) => string,
): string {
  if (!status) return t("unknown");

  const key = status.toLowerCase().replace(/-/g, "_");
  const translated = t(key);

  if (translated === key) {
    return status.replace(/_/g, " ");
  }

  return translated;
}

export function invoiceStatusTone(
  status: string,
): "default" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "paid":
      return "success";
    case "issued":
    case "sent":
    case "viewed":
      return "info";
    case "partially_paid":
      return "warning";
    case "overdue":
      return "danger";
    default:
      return "default";
  }
}

export function ticketStatusTone(
  status: string,
): "default" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "resolved":
    case "closed":
      return "success";
    case "in_progress":
    case "in_review":
      return "info";
    case "waiting_client":
      return "warning";
    default:
      return "default";
  }
}
