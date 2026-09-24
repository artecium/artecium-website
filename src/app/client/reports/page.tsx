import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import {
  formatDate,
  formatStatusLabel,
  listSectionMessage,
} from "@/lib/data/client-format";
import { getClientReports } from "@/lib/data/client-reports";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { requireClientAuth } from "@/lib/auth/session";

export default async function ClientReportsPage() {
  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;
  const dbState = await getDatabaseReadyState();
  const reportsResult = await getClientReports(companyIds);
  const section = listSectionMessage(
    reportsResult,
    "No reports available yet",
    "Monthly and project reports will appear here when published by Artecium.",
  );

  return (
    <>
      <PageHeader
        title="Reports"
        description="Monthly and project reports shared with your company."
      />

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
                    {formatStatusLabel(report.report_type)}
                    {report.project_name ? ` · ${report.project_name}` : ""}
                  </p>
                </div>
                <StatusBadge label="Client visible" tone="info" />
              </div>
              <p className="mt-3 text-sm text-[#94A3B8]">
                Period {formatDate(report.period_start)} – {formatDate(report.period_end)}
              </p>
              <p className="mt-1 text-xs text-[#64748B]">
                Published {formatDate(report.created_at)}
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
