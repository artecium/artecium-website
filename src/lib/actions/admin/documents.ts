"use server";

import { requireAdminPage } from "@/lib/auth/admin-access";
import {
  assertCompanyAccess,
  assertDocumentAccess,
  assertProjectAccess,
} from "@/lib/auth/resource-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { DOCUMENT_VISIBILITY, PERMISSIONS } from "@/types/platform";
import { revalidatePath } from "next/cache";

const BUCKET = "platform-documents";
const MAX_BYTES = 50 * 1024 * 1024;

function assertVisibility(visibility: string) {
  if (!(DOCUMENT_VISIBILITY as readonly string[]).includes(visibility)) {
    throw new Error("Invalid visibility value.");
  }
}

function buildStoragePath(
  companyId: string,
  projectId: string | null,
  documentId: string,
  filename: string,
) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${companyId}/${projectId ?? "general"}/${documentId}/${safeName}`;
}

export async function uploadDocument(formData: FormData) {
  const session = await requireAdminPage(PERMISSIONS.DOCUMENTS_EDIT);

  const companyId = String(formData.get("companyId") ?? "").trim();
  const projectIdRaw = String(formData.get("projectId") ?? "").trim();
  const projectId = projectIdRaw || null;
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "general").trim();
  const visibility = String(formData.get("visibility") ?? "client_visible");
  const documentType = String(formData.get("documentType") ?? "").trim() || null;
  const file = formData.get("file");

  if (!companyId) throw new Error("Company is required.");
  if (!title) throw new Error("Document title is required.");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("A file is required.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("File exceeds the 50MB limit.");
  }

  assertVisibility(visibility);
  await assertCompanyAccess(companyId);
  if (projectId) {
    const projectCompanyId = await assertProjectAccess(projectId);
    if (projectCompanyId !== companyId) {
      throw new Error("Project does not belong to this company.");
    }
  }

  const supabase = await createClient();
  const { data: docRow, error: docError } = await supabase
    .from("documents")
    .insert({
      company_id: companyId,
      project_id: projectId,
      category,
      title,
      visibility,
      document_type: documentType,
      created_by: session.user.id,
    })
    .select("id")
    .single();

  if (docError || !docRow) {
    throw new Error(docError?.message ?? "Failed to create document record.");
  }

  const documentId = docRow.id as string;
  const storagePath = buildStoragePath(companyId, projectId, documentId, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    await supabase.from("documents").delete().eq("id", documentId);
    throw new Error(uploadError.message);
  }

  const { error: updateError } = await supabase
    .from("documents")
    .update({ file_path: storagePath, updated_at: new Date().toISOString() })
    .eq("id", documentId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  await supabase.from("document_versions").insert({
    document_id: documentId,
    version: 1,
    file_path: storagePath,
    uploaded_by: session.user.id,
  });

  revalidatePath("/admin/documents");
  revalidatePath(`/admin/clients/${companyId}`);
  revalidatePath("/client/documents");
  return documentId;
}

export async function updateDocumentVisibility(documentId: string, visibility: string) {
  await requireAdminPage(PERMISSIONS.DOCUMENTS_EDIT);
  assertVisibility(visibility);
  const { companyId } = await assertDocumentAccess(documentId);

  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({ visibility, updated_at: new Date().toISOString() })
    .eq("id", documentId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/documents");
  if (companyId) revalidatePath(`/admin/clients/${companyId}`);
  revalidatePath("/client/documents");
}

export async function deleteDocument(documentId: string) {
  await requireAdminPage(PERMISSIONS.DOCUMENTS_EDIT);
  const { companyId, filePath } = await assertDocumentAccess(documentId);

  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", documentId);

  if (error) throw new Error(error.message);

  if (filePath) {
    await supabase.storage.from(BUCKET).remove([filePath]);
  }

  revalidatePath("/admin/documents");
  if (companyId) revalidatePath(`/admin/clients/${companyId}`);
  revalidatePath("/client/documents");
}

export async function getDocumentDownloadUrl(documentId: string) {
  await requireAdminPage(PERMISSIONS.DOCUMENTS_VIEW);
  const supabase = await createClient();
  const { data: doc, error } = await supabase
    .from("documents")
    .select("id, file_path, visibility, company_id")
    .eq("id", documentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !doc?.file_path) {
    throw new Error("Document not found or access denied.");
  }

  const admin = createAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(doc.file_path as string, 300);

  if (signError || !signed?.signedUrl) {
    throw new Error(signError?.message ?? "Unable to generate download URL.");
  }

  return signed.signedUrl;
}
