import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { resolveLocale } from "@/i18n/config";
import {
  formatDateTime,
  formatStatusLabel,
  listSectionMessage,
} from "@/lib/data/client-format";
import { getClientMeetings } from "@/lib/data/client-meetings";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { requireClientAuth } from "@/lib/auth/session";
import { getLocale, getTranslations } from "next-intl/server";

function meetingStatusTone(status: string): "default" | "success" | "info" {
  switch (status) {
    case "completed":
      return "success";
    case "scheduled":
      return "info";
    default:
      return "default";
  }
}

export default async function ClientMeetingsPage() {
  const locale = resolveLocale(await getLocale());
  const t = await getTranslations("meetings");
  const tCommon = await getTranslations("common");
  const tErrors = await getTranslations("errors");
  const tStatus = await getTranslations("status");

  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;
  const dbState = await getDatabaseReadyState();
  const meetingsResult = await getClientMeetings(companyIds);
  const section = listSectionMessage(
    meetingsResult,
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
          {meetingsResult.data.map((meeting) => (
            <li
              key={meeting.id}
              className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-4 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-medium text-white">{meeting.title}</h2>
                  {meeting.project_name ? (
                    <p className="mt-1 text-xs text-[#64748B]">
                      {tCommon("project")}: {meeting.project_name}
                    </p>
                  ) : null}
                </div>
                <StatusBadge
                  label={formatStatusLabel(meeting.status, tStatus)}
                  tone={meetingStatusTone(meeting.status)}
                />
              </div>
              <p className="mt-3 text-sm text-[#94A3B8]">
                {formatDateTime(meeting.starts_at, locale)}
                {meeting.ends_at
                  ? ` – ${formatDateTime(meeting.ends_at, locale)}`
                  : null}
              </p>
              {meeting.meeting_url ? (
                <p className="mt-2 break-all text-xs text-[#64748B]">
                  {tCommon("link")}: {meeting.meeting_url}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={section.emptyTitle} description={section.emptyDescription} />
      )}
    </>
  );
}
