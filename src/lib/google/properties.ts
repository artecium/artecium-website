import "server-only";

import { google } from "googleapis";

import type { Ga4PropertyOption, GscSiteOption } from "@/lib/google/connections";
import { getOAuthClientForStoredToken } from "@/lib/google/oauth-client";
import type { GoogleIntegrationKind } from "@/lib/google/config";

export async function listGa4PropertiesForToken(
  tokenId: string,
): Promise<Ga4PropertyOption[]> {
  const { client } = await getOAuthClientForStoredToken(
    tokenId,
    "google_analytics",
  );

  const adminApi = google.analyticsadmin({ version: "v1beta", auth: client });
  const response = await adminApi.accountSummaries.list();
  const options: Ga4PropertyOption[] = [];

  for (const account of response.data.accountSummaries ?? []) {
    const accountName = account.displayName ?? account.account ?? "Account";
    for (const property of account.propertySummaries ?? []) {
      const resource = property.property ?? "";
      const propertyId = resource.replace(/^properties\//, "");
      if (!propertyId) continue;
      options.push({
        propertyId,
        displayName: property.displayName ?? propertyId,
        accountName,
      });
    }
  }

  return options.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function listGscSitesForToken(tokenId: string): Promise<GscSiteOption[]> {
  const { client } = await getOAuthClientForStoredToken(
    tokenId,
    "google_search_console",
  );

  const sc = google.searchconsole({ version: "v1", auth: client });
  const response = await sc.sites.list();
  const options: GscSiteOption[] = [];

  for (const entry of response.data.siteEntry ?? []) {
    if (!entry.siteUrl) continue;
    options.push({
      siteUrl: entry.siteUrl,
      permissionLevel: entry.permissionLevel ?? null,
    });
  }

  return options.sort((a, b) => a.siteUrl.localeCompare(b.siteUrl));
}

export function integrationForTokenLookup(
  kind: "analytics" | "seo",
): GoogleIntegrationKind {
  return kind === "analytics" ? "google_analytics" : "google_search_console";
}
