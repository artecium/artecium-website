import {
  type DataFetchResult,
  fromQueryResult,
  skippedFetchResult,
} from "@/lib/data/supabase-query";
import { createClient } from "@/lib/supabase/server";

export interface ClientProjectRow {
  id: string;
  name: string;
  description: string | null;
  progress: number;
  start_date: string | null;
  due_date: string | null;
  status_label: string | null;
  status_color: string | null;
  status_slug: string | null;
  updated_at: string;
}

export interface ClientMilestoneRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
}

export interface ClientTaskRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  milestone_id: string | null;
  priority: string;
}

export interface ClientProjectDetail extends ClientProjectRow {
  milestones: ClientMilestoneRow[];
  tasks: ClientTaskRow[];
}

function mapProjectRow(row: Record<string, unknown>): ClientProjectRow {
  const status = row.project_statuses as
    | { label: string; color: string | null; slug: string }
    | { label: string; color: string | null; slug: string }[]
    | null;
  const statusRow = Array.isArray(status) ? status[0] : status;

  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    progress: Number(row.progress ?? 0),
    start_date: (row.start_date as string | null) ?? null,
    due_date: (row.due_date as string | null) ?? null,
    status_label: statusRow?.label ?? null,
    status_color: statusRow?.color ?? null,
    status_slug: statusRow?.slug ?? null,
    updated_at: row.updated_at as string,
  };
}

export async function getClientProjects(
  companyIds: string[],
): Promise<DataFetchResult<ClientProjectRow[]>> {
  if (!companyIds.length) {
    return skippedFetchResult([], "getClientProjects requires companyIds");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      name,
      description,
      progress,
      start_date,
      due_date,
      updated_at,
      project_statuses ( label, color, slug )
    `,
    )
    .in("company_id", companyIds)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    return fromQueryResult("client-projects.getClientProjects", null, error, []);
  }

  const projects = (data ?? []).map((row) =>
    mapProjectRow(row as Record<string, unknown>),
  );

  return fromQueryResult("client-projects.getClientProjects", projects, null, []);
}

export async function getClientProjectDetail(
  projectId: string,
  companyIds: string[],
): Promise<DataFetchResult<ClientProjectDetail | null>> {
  if (!companyIds.length) {
    return skippedFetchResult(null, "getClientProjectDetail requires companyIds");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      name,
      description,
      progress,
      start_date,
      due_date,
      updated_at,
      project_statuses ( label, color, slug )
    `,
    )
    .eq("id", projectId)
    .in("company_id", companyIds)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    return fromQueryResult("client-projects.getClientProjectDetail", null, error, null);
  }

  if (!data) {
    return fromQueryResult("client-projects.getClientProjectDetail", null, null, null);
  }

  const base = mapProjectRow(data as Record<string, unknown>);

  const [milestonesResult, tasksResult] = await Promise.all([
    supabase
      .from("project_milestones")
      .select("id, title, description, status, due_date, completed_at, sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("tasks")
      .select("id, title, description, status, due_date, milestone_id, priority")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
  ]);

  if (milestonesResult.error) {
    return fromQueryResult(
      "client-projects.getClientProjectDetail.milestones",
      null,
      milestonesResult.error,
      null,
    );
  }

  if (tasksResult.error) {
    return fromQueryResult(
      "client-projects.getClientProjectDetail.tasks",
      null,
      tasksResult.error,
      null,
    );
  }

  const detail: ClientProjectDetail = {
    ...base,
    milestones: (milestonesResult.data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      description: (row.description as string | null) ?? null,
      status: row.status as string,
      due_date: (row.due_date as string | null) ?? null,
      completed_at: (row.completed_at as string | null) ?? null,
      sort_order: Number(row.sort_order ?? 0),
    })),
    tasks: (tasksResult.data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      description: (row.description as string | null) ?? null,
      status: row.status as string,
      due_date: (row.due_date as string | null) ?? null,
      milestone_id: (row.milestone_id as string | null) ?? null,
      priority: row.priority as string,
    })),
  };

  return fromQueryResult("client-projects.getClientProjectDetail", detail, null, null);
}
