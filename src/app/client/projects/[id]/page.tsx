import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import {
  formatDate,
  formatStatusLabel,
} from "@/lib/data/client-format";
import { getClientProjectDetail } from "@/lib/data/client-projects";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { requireClientAuth } from "@/lib/auth/session";
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
  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;
  const dbState = await getDatabaseReadyState();
  const projectResult = await getClientProjectDetail(id, companyIds);
  const project = projectResult.data;

  if (projectResult.skipped || projectResult.accessDenied || projectResult.error) {
    return (
      <>
        <PageHeader title="Project details" description="Timeline, tasks, and deliverables." />
        <EmptyState
          title={projectResult.accessDenied ? "Unable to load data" : "Project unavailable"}
          description={
            projectResult.accessDenied
              ? "Access to this project was denied."
              : projectResult.error ?? "This project could not be loaded."
          }
        />
      </>
    );
  }

  if (!project) {
    return (
      <>
        <PageHeader title="Project details" description="Timeline, tasks, and deliverables." />
        <EmptyState
          title="Project not found"
          description="This project is not available for your account."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={project.name}
        description={project.description ?? "Project timeline, milestones, and tasks."}
        actions={
          <Link
            href="/client/projects"
            className="text-sm text-[#2563EB] transition-colors hover:text-[#60A5FA]"
          >
            ← Back to projects
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
          <span className="text-sm text-[#94A3B8]">{project.progress}% complete</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#050816]">
          <div
            className="h-full rounded-full bg-[#2563EB]"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#64748B]">Start date</dt>
            <dd className="mt-0.5 text-[#94A3B8]">{formatDate(project.start_date)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#64748B]">Due date</dt>
            <dd className="mt-0.5 text-[#94A3B8]">{formatDate(project.due_date)}</dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
          <h2 className="text-base font-medium text-white">Milestones</h2>
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
                      label={formatStatusLabel(milestone.status)}
                      tone={milestoneTone(milestone.status)}
                    />
                  </div>
                  {milestone.description ? (
                    <p className="mt-2 text-xs text-[#64748B]">{milestone.description}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-[#64748B]">
                    Due {formatDate(milestone.due_date)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[#64748B]">No milestones yet.</p>
          )}
        </section>

        <section className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
          <h2 className="text-base font-medium text-white">Tasks</h2>
          {project.tasks.length ? (
            <ul className="mt-4 space-y-3">
              {project.tasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-xl border border-[#1E293B] bg-[#050816]/40 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-medium text-white">{task.title}</p>
                    <StatusBadge label={formatStatusLabel(task.status)} tone="default" />
                  </div>
                  {task.description ? (
                    <p className="mt-2 text-xs text-[#64748B]">{task.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[#64748B]">No tasks yet.</p>
          )}
        </section>
      </div>
    </>
  );
}
