import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import {
  formatDate,
  listSectionMessage,
} from "@/lib/data/client-format";
import { getClientProjects } from "@/lib/data/client-projects";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { requireClientAuth } from "@/lib/auth/session";
import Link from "next/link";

export default async function ClientProjectsPage() {
  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;
  const dbState = await getDatabaseReadyState();
  const projectsResult = await getClientProjects(companyIds);
  const section = listSectionMessage(
    projectsResult,
    "No projects yet",
    "Your active and completed projects will appear here once assigned by Artecium.",
  );

  return (
    <>
      <PageHeader
        title="Projects"
        description="View your active and completed projects, progress, timeline, and deliverables."
      />

      {!dbState.configured ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {dbState.message}
        </div>
      ) : null}

      {section.hasData ? (
        <div className="space-y-3">
          {projectsResult.data.map((project) => (
            <Link
              key={project.id}
              href={`/client/projects/${project.id}`}
              className="block rounded-2xl border border-[#1E293B] bg-[#0E1324] p-4 transition-colors hover:border-[#2563EB]/40 sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-white">{project.name}</h2>
                    {project.status_label ? (
                      <StatusBadge label={project.status_label} tone="info" />
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-[#94A3B8]">
                    {project.progress}% complete
                  </p>
                  <p className="mt-1 text-xs text-[#64748B]">
                    Due {formatDate(project.due_date)}
                  </p>
                </div>
                <div className="w-full sm:w-48">
                  <div className="h-2 overflow-hidden rounded-full bg-[#050816]">
                    <div
                      className="h-full rounded-full bg-[#2563EB]"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title={section.emptyTitle} description={section.emptyDescription} />
      )}
    </>
  );
}
