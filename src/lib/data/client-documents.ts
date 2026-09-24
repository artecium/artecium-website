import {
  type DataFetchResult,
  fromQueryResult,
  skippedFetchResult,
} from "@/lib/data/supabase-query";
import { createClient } from "@/lib/supabase/server";

export interface ClientDocumentRow {
  id: string;
  title: string;
  category: string;
  document_type: string | null;
  visibility: string;
  file_path: string | null;
  created_at: string;
  project_name: string | null;
}

export async function getClientDocuments(
  companyIds: string[],
): Promise<DataFetchResult<ClientDocumentRow[]>> {
  if (!companyIds.length) {
    return skippedFetchResult([], "getClientDocuments requires companyIds");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select(
      `
      id,
      title,
      category,
      document_type,
      visibility,
      file_path,
      created_at,
      projects ( name )
    `,
    )
    .in("company_id", companyIds)
    .eq("visibility", "client_visible")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return fromQueryResult("client-documents.getClientDocuments", null, error, []);
  }

  const documents = (data ?? []).map((row) => {
    const projects = row.projects as { name: string } | { name: string }[] | null;
    const project = Array.isArray(projects) ? projects[0] : projects;

    return {
      id: row.id as string,
      title: row.title as string,
      category: row.category as string,
      document_type: (row.document_type as string | null) ?? null,
      visibility: row.visibility as string,
      file_path: (row.file_path as string | null) ?? null,
      created_at: row.created_at as string,
      project_name: project?.name ?? null,
    };
  });

  return fromQueryResult("client-documents.getClientDocuments", documents, null, []);
}
