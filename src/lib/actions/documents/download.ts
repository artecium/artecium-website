"use server";

import { getAuthSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "platform-documents";

export async function getClientDocumentDownloadUrl(documentId: string): Promise<string> {
  const session = await getAuthSession();
  if (!session) throw new Error("Authentication required.");

  const supabase = await createClient();
  const { data: doc, error } = await supabase
    .from("documents")
    .select("id, file_path, visibility")
    .eq("id", documentId)
    .eq("visibility", "client_visible")
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
