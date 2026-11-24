import "server-only";

import type { GoogleIntegrationKind } from "@/lib/google/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function ensureAuthorizingConnection(
  companyId: string,
  integration: GoogleIntegrationKind,
): Promise<string> {
  const admin = createAdminClient();
  const table =
    integration === "google_analytics" ? "analytics_connections" : "seo_connections";
  const provider =
    integration === "google_analytics" ? "google_analytics" : "google_search_console";

  const { data: existing } = await admin
    .from(table)
    .select("id, status")
    .eq("company_id", companyId)
    .in("status", ["authorizing", "pending_property", "active", "inactive", "token_expired"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await admin
      .from(table)
      .update({ status: "authorizing", updated_at: new Date().toISOString() })
      .eq("id", existing.id as string);
    return existing.id as string;
  }

  const { data, error } = await admin
    .from(table)
    .insert({
      company_id: companyId,
      provider,
      status: "authorizing",
      metadata: { oauth: true },
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error("Unable to prepare integration connection.");
  }

  return data.id as string;
}

export async function attachTokenToConnection(
  integration: GoogleIntegrationKind,
  connectionId: string,
  tokenId: string,
): Promise<void> {
  const admin = createAdminClient();
  const table =
    integration === "google_analytics" ? "analytics_connections" : "seo_connections";

  const { error } = await admin
    .from(table)
    .update({
      secret_reference: tokenId,
      status: "pending_property",
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: { oauth: true, awaiting_property: true },
    })
    .eq("id", connectionId);

  if (error) {
    throw new Error("Unable to link Google authorization to connection.");
  }
}

export async function archiveDemoConnectionsForCompany(
  companyId: string,
  integration: GoogleIntegrationKind,
  keepConnectionId?: string,
): Promise<void> {
  const admin = createAdminClient();
  const table =
    integration === "google_analytics" ? "analytics_connections" : "seo_connections";

  let query = admin
    .from(table)
    .select("id, property_id, site_url, metadata, status")
    .eq("company_id", companyId);

  if (keepConnectionId) {
    query = query.neq("id", keepConnectionId);
  }

  const { data: rows } = await query;

  for (const row of rows ?? []) {
    const metadata = (row.metadata as Record<string, unknown> | null) ?? {};
    const isDemo =
      metadata.demo === true ||
      metadata.demo === "demo" ||
      (row.property_id as string | null) === "GA-DEMO-123456" ||
      (row.site_url as string | null) === "https://demo.artecium.test";

    if (!isDemo && row.status !== "archived") continue;

    await admin
      .from(table)
      .update({
        status: "archived",
        updated_at: new Date().toISOString(),
        metadata: { ...metadata, archived_reason: "replaced_by_real_integration" },
      })
      .eq("id", row.id as string);
  }
}

export async function deactivateOtherConnections(
  companyId: string,
  integration: GoogleIntegrationKind,
  activeConnectionId: string,
): Promise<void> {
  const admin = createAdminClient();
  const table =
    integration === "google_analytics" ? "analytics_connections" : "seo_connections";

  await admin
    .from(table)
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("company_id", companyId)
    .neq("id", activeConnectionId)
    .neq("status", "archived");
}

export function sanitizeConnectionForClient(row: Record<string, unknown>) {
  return {
    id: row.id,
    company_id: row.company_id,
    property_id: row.property_id ?? null,
    site_url: row.site_url ?? null,
    display_name: row.display_name ?? null,
    status: row.status,
    connected_at: row.connected_at ?? null,
    last_sync_at: row.last_sync_at ?? null,
  };
}

export type Ga4PropertyOption = {
  propertyId: string;
  displayName: string;
  accountName: string;
};

export type GscSiteOption = {
  siteUrl: string;
  permissionLevel: string | null;
};
