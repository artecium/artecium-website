import { AdminListCard } from "@/components/admin/AdminListCard";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { MilestoneForm } from "@/components/admin/MilestoneForm";
import { ProjectMemberForm, ProjectMemberRow } from "@/components/admin/ProjectMemberForm";
import { ProjectProgressForm } from "@/components/admin/ProjectProgressForm";
import { TaskForm } from "@/components/admin/TaskForm";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { requireAdminPage } from "@/lib/auth/admin-access";
import {
  getAdminProjectDetail,
  getStaffProfilesForAssignment,
} from "@/lib/data/admin/queries";
import { formatDate, formatDateTime, formatStatusLabel } from "@/lib/data/client-format";
import { PERMISSIONS } from "@/types/platform";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "milestones", label: "Milestones" },
  { id: "tasks", label: "Tasks" },
  { id: "members", label: "Members" },
  { id: "documents", label: "Documents" },
  { id: "reports", label: "Reports" },
  { id: "meetings", label: "Meetings" },
];

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminProjectDetailPage({
  params,
  searchParams,
}: ProjectDetailPageProps) {
  const session = await requireAdminPage(PERMISSIONS.PROJECTS_VIEW);
  const { id } = await params;
  const { tab = "overview" } = await searchParams;
  const detail = await getAdminProjectDetail(id);

  if (!detail.project) notFound();

  const project = detail.project as Record<string, unknown>;
  const company = project.companies as { name?: string } | { name?: string }[] | null;
  const companyName = Array.isArray(company) ? company[0]?.name : company?.name;
  const status = project.project_statuses as { label?: string } | { label?: string }[] | null;
  const statusLabel = Array.isArray(status) ? status[0]?.label : status?.label;
  const owner = project.profiles as { full_name?: string; email?: string } | { full_name?: string; email?: string }[] | null;
  const ownerRow = Array.isArray(owner) ? owner[0] : owner;

  const canEdit = session.profile.permissions.includes(PERMISSIONS.PROJECTS_EDIT);
  const canAssign = session.profile.permissions.includes(PERMISSIONS.PROJECTS_ASSIGN);
  const staffProfiles = canEdit || canAssign ? await getStaffProfilesForAssignment() : [];
  const assignees = staffProfiles.map((p) => ({
    id: p.id as string,
    label: (p.full_name as string) ?? (p.email as string),
  }));

  const milestones = detail.milestones as Record<string, unknown>[];
  const tasks = detail.tasks as Record<string, unknown>[];
  const members = detail.members as Record<string, unknown>[];

  return (
    <>
      <PageHeader
        title={project.name as string}
        description={companyName ? `Client: ${companyName}` : "Project details"}
      />

      <AdminTabs tabs={TABS} activeTab={tab} basePath={`/admin/projects/${id}`} />

      {tab === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
              <h3 className="mb-4 font-medium text-white">Summary</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#64748B]">Status</dt>
                  <dd><StatusBadge label={(statusLabel ?? "unknown").toUpperCase()} /></dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#64748B]">Owner</dt>
                  <dd className="text-white">{ownerRow?.full_name ?? ownerRow?.email ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#64748B]">Due date</dt>
                  <dd className="text-white">{formatDate(project.due_date as string | null)}</dd>
                </div>
              </dl>
            </div>
            {canEdit ? (
              <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
                <h3 className="mb-4 font-medium text-white">Progress</h3>
                <ProjectProgressForm
                  projectId={id}
                  initialProgress={Number(project.progress ?? 0)}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === "milestones" ? (
        <div className="space-y-6">
          {canEdit ? <MilestoneForm projectId={id} /> : null}
          {milestones.length ? (
            milestones.map((m) => (
              <div key={m.id as string} className="space-y-3">
                <AdminListCard
                  title={m.title as string}
                  subtitle={m.description as string}
                  meta={<StatusBadge label={formatStatusLabel((m.status as string) ?? "pending")} />}
                />
                {canEdit ? (
                  <MilestoneForm
                    projectId={id}
                    milestone={{
                      id: m.id as string,
                      title: m.title as string,
                      description: m.description as string | null,
                      status: m.status as string,
                      due_date: m.due_date as string | null,
                      sort_order: m.sort_order as number,
                    }}
                  />
                ) : null}
              </div>
            ))
          ) : (
            <EmptyState title="No milestones" description="Create the first milestone for this project." />
          )}
        </div>
      ) : null}

      {tab === "tasks" ? (
        <div className="space-y-6">
          {canEdit ? <TaskForm projectId={id} assignees={assignees} /> : null}
          {tasks.length ? (
            tasks.map((t) => (
              <div key={t.id as string} className="space-y-3">
                <AdminListCard
                  title={t.title as string}
                  subtitle={`Due ${formatDate(t.due_date as string | null)} · ${t.priority as string}`}
                  meta={<StatusBadge label={formatStatusLabel(t.status as string)} />}
                />
                {canEdit ? (
                  <TaskForm
                    projectId={id}
                    assignees={assignees}
                    task={{
                      id: t.id as string,
                      title: t.title as string,
                      description: t.description as string | null,
                      status: t.status as string,
                      priority: t.priority as string,
                      due_date: t.due_date as string | null,
                      assignee_id: t.assignee_id as string | null,
                    }}
                  />
                ) : null}
              </div>
            ))
          ) : (
            <EmptyState title="No tasks" description="Create the first task for this project." />
          )}
        </div>
      ) : null}

      {tab === "members" ? (
        <div className="space-y-6">
          {canAssign ? (
            <ProjectMemberForm projectId={id} candidates={assignees} />
          ) : null}
          {members.length ? (
            members.map((m) => {
              const profile = m.profiles as
                | { full_name?: string; email?: string }
                | { full_name?: string; email?: string }[]
                | null;
              const profileRow = Array.isArray(profile) ? profile[0] : profile;
              return canAssign ? (
                <ProjectMemberRow
                  key={m.user_id as string}
                  projectId={id}
                  userId={m.user_id as string}
                  name={profileRow?.full_name ?? profileRow?.email ?? "Member"}
                  email={profileRow?.email ?? "—"}
                  role={m.role as string}
                />
              ) : (
                <AdminListCard
                  key={m.user_id as string}
                  title={profileRow?.full_name ?? profileRow?.email ?? "Member"}
                  subtitle={m.role as string}
                />
              );
            })
          ) : (
            <EmptyState title="No members" description="Add team members to this project." />
          )}
        </div>
      ) : null}

      {tab === "documents" ? (
        <ListSection
          items={detail.documents as Record<string, unknown>[]}
          emptyTitle="No documents"
          render={(d) => (
            <AdminListCard
              title={d.title as string}
              subtitle={formatDate(d.created_at as string)}
              meta={<StatusBadge label={formatStatusLabel(d.visibility as string)} tone="info" />}
            />
          )}
        />
      ) : null}

      {tab === "reports" ? (
        <ListSection
          items={detail.reports as Record<string, unknown>[]}
          emptyTitle="No reports"
          render={(r) => (
            <AdminListCard title={r.title as string} subtitle={r.report_type as string} />
          )}
        />
      ) : null}

      {tab === "meetings" ? (
        <ListSection
          items={detail.meetings as Record<string, unknown>[]}
          emptyTitle="No meetings"
          render={(m) => (
            <AdminListCard
              title={m.title as string}
              subtitle={formatDateTime(m.starts_at as string)}
              meta={<StatusBadge label={formatStatusLabel(m.status as string)} />}
            />
          )}
        />
      ) : null}

      <div className="mt-6">
        <Link href="/admin/projects" className="text-sm text-[#93C5FD] hover:underline">
          ← Back to projects
        </Link>
      </div>
    </>
  );
}

function ListSection({
  items,
  emptyTitle,
  render,
}: {
  items: Record<string, unknown>[];
  emptyTitle: string;
  render: (item: Record<string, unknown>) => ReactNode;
}) {
  if (!items.length) {
    return <EmptyState title={emptyTitle} description="No records for this project." />;
  }
  return <div className="space-y-3">{items.map((item, i) => <div key={i}>{render(item)}</div>)}</div>;
}
