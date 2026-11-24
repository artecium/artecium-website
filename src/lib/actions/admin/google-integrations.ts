"use server";

import { requireAdminPage } from "@/lib/auth/admin-access";
import { AccessDeniedError, assertCompanyAccess } from "@/lib/auth/resource-access";
import {
  archiveDemoConnectionsForCompany,
  deactivateOtherConnections,
} from "@/lib/google/connections";
import type { Ga4PropertyOption, GscSiteOption } from "@/lib/google/connections";
import {
  fetchGa4DailyMetricsForProperty,
  toPublicSyncError,
} from "@/lib/google/analytics-sync";
import {
  listGa4PropertiesForToken,
  listGscSitesForToken,
} from "@/lib/google/properties";
import {
  getGoogleOAuthTokenById,
  revokeGoogleOAuthToken,
} from "@/lib/google/token-store";
import { revokeGoogleTokenAtProvider } from "@/lib/google/oauth-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/types/platform";
import { revalidatePath } from "next/cache";

export type GoogleIntegrationActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function integrationPermission(kind: "analytics" | "seo") {
  return kind === "analytics" ? PERMISSIONS.ANALYTICS_VIEW : PERMISSIONS.SEO_VIEW;
}

async function loadConnectionForStaff(
  connectionId: string,
  kind: "analytics" | "seo",
): Promise<{
  id: string;
  company_id: string;
  status: string;
  secret_reference: string | null;
}> {
  await requireAdminPage(integrationPermission(kind));
  const supabase = await createClient();
  const table = kind === "analytics" ? "analytics_connections" : "seo_connections";

  const { data, error } = await supabase
    .from(table)
    .select("id, company_id, status")
    .eq("id", connectionId)
    .maybeSingle();

  if (error || !data) {
    throw new AccessDeniedError("Connection not found or access denied.");
  }

  await assertCompanyAccess(data.company_id as string);

  const admin = createAdminClient();
  const { data: secretRow, error: secretError } = await admin
    .from(table)
    .select("secret_reference")
    .eq("id", connectionId)
    .maybeSingle();

  if (secretError || !secretRow) {
    throw new AccessDeniedError("Connection not found.");
  }

  return {
    id: data.id as string,
    company_id: data.company_id as string,
    status: data.status as string,
    secret_reference: (secretRow.secret_reference as string | null) ?? null,
  };
}

const DEMO_ANALYTICS_PROPERTY_ID = "GA-DEMO-123456";

async function loadActiveAnalyticsConnectionForSync(connectionId: string): Promise<{
  id: string;
  company_id: string;
  property_id: string;
  secret_reference: string;
}> {
  await requireAdminPage(PERMISSIONS.ANALYTICS_VIEW);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analytics_connections")
    .select("id, company_id, status, property_id")
    .eq("id", connectionId)
    .maybeSingle();

  if (error || !data) {
    throw new AccessDeniedError("Connection not found or access denied.");
  }

  await assertCompanyAccess(data.company_id as string);

  if (data.status !== "active") {
    throw new AccessDeniedError("Only active connections can be synced.");
  }

  const propertyId = (data.property_id as string | null)?.trim();
  if (!propertyId || propertyId === DEMO_ANALYTICS_PROPERTY_ID) {
    throw new AccessDeniedError("Connection has no real GA4 property configured.");
  }

  const admin = createAdminClient();
  const { data: secretRow, error: secretError } = await admin
    .from("analytics_connections")
    .select("secret_reference")
    .eq("id", connectionId)
    .maybeSingle();

  if (secretError || !secretRow?.secret_reference) {
    throw new AccessDeniedError("Google authorization is missing for this connection.");
  }

  return {
    id: data.id as string,
    company_id: data.company_id as string,
    property_id: propertyId,
    secret_reference: secretRow.secret_reference as string,
  };
}

export async function syncGa4MetricsForConnection(
  connectionId: string,
): Promise<
  GoogleIntegrationActionResult<{ daysSynced: number; lastSyncAt: string; rowsUpserted: number }>
> {
  try {
    const connection = await loadActiveAnalyticsConnectionForSync(connectionId);
    const dailyRows = await fetchGa4DailyMetricsForProperty(
      connection.property_id,
      connection.secret_reference,
    );

    const admin = createAdminClient();
    const now = new Date().toISOString();
    const payload = { real: true, source: "ga4_data_api" as const };

    if (dailyRows.length > 0) {
      const upsertRows = dailyRows.map((row) => ({
        connection_id: connection.id,
        metric_date: row.metricDate,
        users: row.users,
        sessions: row.sessions,
        page_views: row.pageViews,
        conversions: row.conversions,
        payload,
      }));

      const { error: upsertError } = await admin.from("analytics_data").upsert(upsertRows, {
        onConflict: "connection_id,metric_date",
      });

      if (upsertError) {
        return { ok: false, error: "Unable to save synced metrics." };
      }
    }

    const { error: connectionError } = await admin
      .from("analytics_connections")
      .update({
        last_sync_at: now,
        updated_at: now,
      })
      .eq("id", connection.id);

    if (connectionError) {
      return { ok: false, error: "Metrics fetched but last sync time could not be updated." };
    }

    revalidatePath("/admin/analytics");
    revalidatePath("/client/analytics");
    revalidatePath(`/admin/clients/${connection.company_id}`);

    return {
      ok: true,
      data: {
        daysSynced: dailyRows.length,
        lastSyncAt: now,
        rowsUpserted: dailyRows.length,
      },
    };
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: toPublicSyncError(error) };
  }
}

export async function listGa4PropertiesForConnection(
  connectionId: string,
): Promise<GoogleIntegrationActionResult<Ga4PropertyOption[]>> {
  try {
    const connection = await loadConnectionForStaff(connectionId, "analytics");
    if (!connection.secret_reference) {
      return { ok: false, error: "Connect Google Analytics before selecting a property." };
    }

    const properties = await listGa4PropertiesForToken(connection.secret_reference);
    return { ok: true, data: properties };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to list properties.";
    return { ok: false, error: message };
  }
}

export async function listGscSitesForConnection(
  connectionId: string,
): Promise<GoogleIntegrationActionResult<GscSiteOption[]>> {
  try {
    const connection = await loadConnectionForStaff(connectionId, "seo");
    if (!connection.secret_reference) {
      return { ok: false, error: "Connect Search Console before selecting a site." };
    }

    const sites = await listGscSitesForToken(connection.secret_reference);
    return { ok: true, data: sites };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to list sites.";
    return { ok: false, error: message };
  }
}

export async function activateGa4Property(
  connectionId: string,
  propertyId: string,
  displayName: string,
  accountId?: string | null,
): Promise<GoogleIntegrationActionResult<{ connectionId: string }>> {
  try {
    const connection = await loadConnectionForStaff(connectionId, "analytics");
    if (!connection.secret_reference) {
      return { ok: false, error: "Missing Google authorization." };
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();

    const { error } = await admin
      .from("analytics_connections")
      .update({
        property_id: propertyId.trim(),
        display_name: displayName.trim() || propertyId,
        account_id: accountId?.trim() || null,
        status: "active",
        connected_at: now,
        updated_at: now,
        metadata: { oauth: true, real: true },
      })
      .eq("id", connectionId);

    if (error) {
      return { ok: false, error: "Unable to save property selection." };
    }

    await archiveDemoConnectionsForCompany(
      connection.company_id,
      "google_analytics",
      connectionId,
    );
    await deactivateOtherConnections(
      connection.company_id,
      "google_analytics",
      connectionId,
    );

    revalidatePath("/admin/analytics");
    revalidatePath(`/admin/clients/${connection.company_id}`);
    return { ok: true, data: { connectionId } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to activate property.";
    return { ok: false, error: message };
  }
}

export async function activateGscSite(
  connectionId: string,
  siteUrl: string,
): Promise<GoogleIntegrationActionResult<{ connectionId: string }>> {
  try {
    const connection = await loadConnectionForStaff(connectionId, "seo");
    if (!connection.secret_reference) {
      return { ok: false, error: "Missing Google authorization." };
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();
    const normalizedSite = siteUrl.trim();

    const { error } = await admin
      .from("seo_connections")
      .update({
        site_url: normalizedSite,
        property_identifier: normalizedSite,
        display_name: normalizedSite,
        status: "active",
        connected_at: now,
        updated_at: now,
        metadata: { oauth: true, real: true },
      })
      .eq("id", connectionId);

    if (error) {
      return { ok: false, error: "Unable to save site selection." };
    }

    await archiveDemoConnectionsForCompany(
      connection.company_id,
      "google_search_console",
      connectionId,
    );
    await deactivateOtherConnections(
      connection.company_id,
      "google_search_console",
      connectionId,
    );

    revalidatePath("/admin/seo");
    revalidatePath(`/admin/clients/${connection.company_id}`);
    return { ok: true, data: { connectionId } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to activate site.";
    return { ok: false, error: message };
  }
}

export async function disconnectGoogleIntegration(
  connectionId: string,
  kind: "analytics" | "seo",
): Promise<GoogleIntegrationActionResult<{ connectionId: string }>> {
  try {
    const connection = await loadConnectionForStaff(connectionId, kind);
    const admin = createAdminClient();
    const table = kind === "analytics" ? "analytics_connections" : "seo_connections";

    if (connection.secret_reference) {
      const token = await getGoogleOAuthTokenById(connection.secret_reference);
      if (token?.refreshToken) {
        await revokeGoogleTokenAtProvider(token.refreshToken);
      }
      await revokeGoogleOAuthToken(connection.secret_reference);
    }

    const { error } = await admin
      .from(table)
      .update({
        status: "inactive",
        secret_reference: null,
        updated_at: new Date().toISOString(),
        metadata: { oauth: false, disconnected_at: new Date().toISOString() },
      })
      .eq("id", connectionId);

    if (error) {
      return { ok: false, error: "Unable to disconnect integration." };
    }

    revalidatePath(kind === "analytics" ? "/admin/analytics" : "/admin/seo");
    revalidatePath(`/admin/clients/${connection.company_id}`);
    return { ok: true, data: { connectionId } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to disconnect.";
    return { ok: false, error: message };
  }
}
