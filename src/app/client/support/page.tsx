import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { resolveLocale } from "@/i18n/config";
import {
  formatDateTime,
  formatStatusLabel,
  listSectionMessage,
} from "@/lib/data/client-format";
import { ticketStatusTone } from "@/lib/i18n/status";
import { getClientTickets } from "@/lib/data/client-support";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { requireClientAuth } from "@/lib/auth/session";
import { getLocale, getTranslations } from "next-intl/server";

export default async function ClientSupportPage() {
  const locale = resolveLocale(await getLocale());
  const t = await getTranslations("support");
  const tCommon = await getTranslations("common");
  const tErrors = await getTranslations("errors");
  const tStatus = await getTranslations("status");

  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;
  const dbState = await getDatabaseReadyState();
  const ticketsResult = await getClientTickets(companyIds);
  const section = listSectionMessage(
    ticketsResult,
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
        <div className="space-y-4">
          {ticketsResult.data.map((ticket) => (
            <article
              key={ticket.id}
              className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-4 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-medium text-white">{ticket.subject}</h2>
                  {ticket.project_name ? (
                    <p className="mt-1 text-xs text-[#64748B]">
                      {tCommon("project")}: {ticket.project_name}
                    </p>
                  ) : null}
                </div>
                <StatusBadge
                  label={formatStatusLabel(ticket.status, tStatus)}
                  tone={ticketStatusTone(ticket.status)}
                />
              </div>
              <p className="mt-2 text-xs text-[#64748B]">
                {tCommon("updated")} {formatDateTime(ticket.updated_at, locale)}
              </p>

              {ticket.messages.length ? (
                <div className="mt-4 space-y-3 border-t border-[#1E293B] pt-4">
                  <h3 className="text-sm font-medium text-white">{t("messages")}</h3>
                  {ticket.messages.map((message) => (
                    <div
                      key={message.id}
                      className="rounded-xl border border-[#1E293B] bg-[#050816]/40 px-4 py-3"
                    >
                      <p className="text-sm text-[#94A3B8]">{message.body}</p>
                      <p className="mt-2 text-xs text-[#64748B]">
                        {formatDateTime(message.created_at, locale)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title={section.emptyTitle} description={section.emptyDescription} />
      )}
    </>
  );
}
