import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { resolveLocale } from "@/i18n/config";
import {
  formatDate,
  formatStatusLabel,
} from "@/lib/data/client-format";
import { getClientProjectDetail } from "@/lib/data/client-projects";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { requireClientAuth } from "@/lib/auth/session";
import { clientAreaHref, readRequestHostname } from "@/lib/routing";
import { getLocale, getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Link from "next/link";

function milestoneTone(
  status: string,
): "default" | "success" | "warning" | "info" {
  switch (status) {
    case "completed":
      return "success";
    case "in_progress":
      return "info";
    case "cancelled":
      return "warning";
    default:
      return "default";
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const requestHeaders = await headers();
  const hostname = readRequestHostname((name) => requestHeaders.get(name));
  const locale = resolveLocale(await getLocale());
  const t = await getTranslations("projects");
  const tCommon = await getTranslations("common");
  const tDashboard = await getTranslations("dashboard");
  const tErrors = await getTranslations("errors");
  const tStatus = await getTranslations("status");

  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;
  const dbState = await getDatabaseReadyState();
  const projectResult = await getClientProjectDetail(id, companyIds);
  const project = projectResult.data;

  if (projectResult.skipped || projectResult.accessDenied || projectResult.error) {
    return (
      <>
        <PageHeader title={t("detailTitle")} description={t("detailDescription")} />
        <EmptyState
          title={
            projectResult.accessDenied
              ? tErrors("accessDeniedTitle")
              : t("unavailableTitle")
          }
          description={
            projectResult.accessDenied
              ? t("accessDeniedDescription")
              : projectResult.error ?? tErrors("loadFailedDescription")
          }
        />
      </>
    );
  }

  if (!project) {
    return (
      <>
        <PageHeader title={t("detailTitle")} description={t("detailDescription")} />
        <EmptyState
          title={t("notFoundTitle")}
          description={t("notFoundDescription")}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={project.name}
        description={project.description ?? t("detailDescriptionFallback")}
        actions={
          <Link
            href={clientAreaHref("/client/projects", hostname)}
            className="text-sm text-[#2563EB] transition-colors hover:text-[#60A5FA]"
          >
            ← {tCommon("backToProjects")}
          </Link>
        }
      />

      {!dbState.configured ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {dbState.message}
        </div>
      ) : null}

      <div className="mb-8 rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
        <div className="flex flex-wrap items-center gap-3">
          {project.status_label ? (
            <StatusBadge label={project.status_label} tone="info" />
          ) : null}
          <span className="text-sm text-[#94A3B8]">
            {tDashboard("progressComplete", { progress: project.progress })}
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#050816]">
          <div
            className="h-full rounded-full bg-[#2563EB]"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#64748B]">
              {tCommon("startDate")}
            </dt>
            <dd className="mt-0.5 text-[#94A3B8]">
              {formatDate(project.start_date, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#64748B]">
              {tCommon("dueDate")}
            </dt>
            <dd className="mt-0.5 text-[#94A3B8]">
              {formatDate(project.due_date, locale)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
          <h2 className="text-base font-medium text-white">{t("milestones")}</h2>
          {project.milestones.length ? (
            <ul className="mt-4 space-y-3">
              {project.milestones.map((milestone) => (
                <li
                  key={milestone.id}
                  className="rounded-xl border border-[#1E293B] bg-[#050816]/40 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-medium text-white">{milestone.title}</p>
                    <StatusBadge
                      label={formatStatusLabel(milestone.status, tStatus)}
                      tone={milestoneTone(milestone.status)}
                    />
                  </div>
                  {milestone.description ? (
                    <p className="mt-2 text-xs text-[#64748B]">{milestone.description}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-[#64748B]">
                    {t("dueOn", { date: formatDate(milestone.due_date, locale) })}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[#64748B]">{t("noMilestones")}</p>
          )}
        </section>

        <section className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
          <h2 className="text-base font-medium text-white">{t("tasks")}</h2>
          {project.tasks.length ? (
            <ul className="mt-4 space-y-3">
              {project.tasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-xl border border-[#1E293B] bg-[#050816]/40 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-medium text-white">{task.title}</p>
                    <StatusBadge
                      label={formatStatusLabel(task.status, tStatus)}
                      tone="default"
                    />
                  </div>
                  {task.description ? (
                    <p className="mt-2 text-xs text-[#64748B]">{task.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[#64748B]">{t("noTasks")}</p>
          )}
        </section>
      </div>
    </>
  );
}
