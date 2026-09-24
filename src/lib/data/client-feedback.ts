import {
  type DataFetchResult,
  fromQueryResult,
  skippedFetchResult,
} from "@/lib/data/supabase-query";
import { createClient } from "@/lib/supabase/server";

export interface ClientFeedbackRow {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string;
  project_name: string | null;
}

export async function getClientFeedback(
  companyIds: string[],
): Promise<DataFetchResult<ClientFeedbackRow[]>> {
  if (!companyIds.length) {
    return skippedFetchResult([], "getClientFeedback requires companyIds");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback")
    .select(
      `
      id,
      rating,
      comment,
      created_at,
      projects ( name )
    `,
    )
    .in("company_id", companyIds)
    .order("created_at", { ascending: false });

  if (error) {
    return fromQueryResult("client-feedback.getClientFeedback", null, error, []);
  }

  const feedback = (data ?? []).map((row) => {
    const projects = row.projects as { name: string } | { name: string }[] | null;
    const project = Array.isArray(projects) ? projects[0] : projects;

    return {
      id: row.id as string,
      rating: row.rating !== null && row.rating !== undefined ? Number(row.rating) : null,
      comment: (row.comment as string | null) ?? null,
      created_at: row.created_at as string,
      project_name: project?.name ?? null,
    };
  });

  return fromQueryResult("client-feedback.getClientFeedback", feedback, null, []);
}
