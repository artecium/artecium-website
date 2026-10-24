import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { resolveLocale } from "@/i18n/config";
import {
  formatDate,
  formatStatusLabel,
  listSectionMessage,
} from "@/lib/data/client-format";
import { getClientReports } from "@/lib/data/client-reports";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { requireClientAuth } from "@/lib/auth/session";
import { getLocale, getTranslations } from "next-intl/server";

export default async function ClientReportsPage() {
  const locale = resolveLocale(await getLocale());
  const t = await getTranslations("reports");
  const tCommon = await getTranslations("common");
  const tErrors = await getTranslations("errors");
  const tStatus = await getTranslations("status");

  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;
  const dbState = await getDatabaseReadyState();
  const reportsResult = await getClientReports(companyIds);
  const section = listSectionMessage(
    reportsResult,
    tErrors,
    t("emptyTitle"),
    t("emptyDescription"),
  );

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      {!dbState.configured ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {dbState.message}
        </div>
      ) : null}

      {section.hasData ? (
        <ul className="space-y-3">
          {reportsResult.data.map((report) => (
            <li
              key={report.id}
              className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-4 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-medium text-white">{report.title}</h2>
                  <p className="mt-1 text-xs text-[#64748B]">
                    {formatStatusLabel(report.report_type, tStatus)}
                    {report.project_name ? ` · ${report.project_name}` : ""}
                  </p>
                </div>
                <StatusBadge label={tCommon("clientVisible")} tone="info" />
              </div>
              <p className="mt-3 text-sm text-[#94A3B8]">
                {t("period", {
                  start: formatDate(report.period_start, locale),
                  end: formatDate(report.period_end, locale),
                })}
              </p>
              <p className="mt-1 text-xs text-[#64748B]">
                {t("publishedOn", { date: formatDate(report.created_at, locale) })}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={section.emptyTitle} description={section.emptyDescription} />
      )}
    </>
  );
}
