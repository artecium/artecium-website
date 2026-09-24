import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import {
  formatDateTime,
  listSectionMessage,
} from "@/lib/data/client-format";
import { getClientFeedback } from "@/lib/data/client-feedback";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { requireClientAuth } from "@/lib/auth/session";

export default async function ClientFeedbackPage() {
  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;
  const dbState = await getDatabaseReadyState();
  const feedbackResult = await getClientFeedback(companyIds);
  const section = listSectionMessage(
    feedbackResult,
    "No feedback yet",
    "Your feedback about projects and services will appear here.",
  );

  return (
    <>
      <PageHeader
        title="Feedback"
        description="Share and review feedback about your projects and services."
      />

      {!dbState.configured ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {dbState.message}
        </div>
      ) : null}

      {section.hasData ? (
        <ul className="space-y-3">
          {feedbackResult.data.map((entry) => (
            <li
              key={entry.id}
              className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-4 sm:p-6"
            >
              <div className="flex flex-wrap items-center gap-3">
                {entry.rating !== null ? (
                  <p className="text-lg font-semibold text-white">
                    {"★".repeat(entry.rating)}
                    <span className="text-[#64748B]">
                      {"★".repeat(Math.max(0, 5 - entry.rating))}
                    </span>
                  </p>
                ) : null}
                {entry.project_name ? (
                  <p className="text-xs text-[#64748B]">{entry.project_name}</p>
                ) : null}
              </div>
              {entry.comment ? (
                <p className="mt-3 text-sm text-[#94A3B8]">{entry.comment}</p>
              ) : null}
              <p className="mt-3 text-xs text-[#64748B]">
                {formatDateTime(entry.created_at)}
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
