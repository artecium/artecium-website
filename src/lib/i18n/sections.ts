import type { DataFetchResult } from "@/lib/data/supabase-query";

type SectionTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export function listSectionMessage(
  result: Pick<DataFetchResult<unknown[]>, "data" | "error" | "accessDenied" | "skipped">,
  t: SectionTranslator,
  emptyTitle: string,
  emptyDescription: string,
): { hasData: boolean; emptyTitle: string; emptyDescription: string } {
  if (result.data.length > 0) {
    return { hasData: true, emptyTitle: "", emptyDescription: "" };
  }

  if (result.skipped) {
    return {
      hasData: false,
      emptyTitle: t("companyUnavailableTitle"),
      emptyDescription: t("companyUnavailableDescription"),
    };
  }

  if (result.accessDenied) {
    return {
      hasData: false,
      emptyTitle: t("accessDeniedTitle"),
      emptyDescription: t("accessDeniedDescription"),
    };
  }

  if (result.error) {
    return {
      hasData: false,
      emptyTitle: t("loadFailedTitle"),
      emptyDescription: t("loadFailedDescription"),
    };
  }

  return { hasData: false, emptyTitle, emptyDescription };
}
