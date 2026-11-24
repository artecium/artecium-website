import "server-only";

import { getAppBaseUrl } from "@/lib/stripe/app-url";

export type GoogleIntegrationKind = "google_analytics" | "google_search_console";

export type GoogleOAuthInitiatorContext = "staff" | "client";

export const GOOGLE_ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
export const GOOGLE_SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

const INTEGRATION_PATH: Record<GoogleIntegrationKind, string> = {
  google_analytics: "analytics",
  google_search_console: "seo",
};

export function getGoogleOAuthClientId(): string {
  const value = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  if (!value) {
    throw new Error("Missing GOOGLE_OAUTH_CLIENT_ID.");
  }
  return value;
}

export function getGoogleOAuthClientSecret(): string {
  const value = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!value) {
    throw new Error("Missing GOOGLE_OAUTH_CLIENT_SECRET.");
  }
  return value;
}

export function getGoogleOAuthStateSecret(): string {
  const value = process.env.GOOGLE_OAUTH_STATE_SECRET?.trim();
  if (!value) {
    throw new Error("Missing GOOGLE_OAUTH_STATE_SECRET.");
  }
  return value;
}

/** Reserved for future scheduled sync routes (not used in this phase). */
export function getGoogleSyncCronSecret(): string | null {
  return process.env.GOOGLE_SYNC_CRON_SECRET?.trim() || null;
}

export function getGoogleOAuthRedirectUri(integration: GoogleIntegrationKind): string {
  const segment = INTEGRATION_PATH[integration];
  return `${getAppBaseUrl()}/api/integrations/google/callback/${segment}`;
}

export function scopesForIntegration(integration: GoogleIntegrationKind): string[] {
  if (integration === "google_analytics") {
    return [GOOGLE_ANALYTICS_SCOPE];
  }
  return [GOOGLE_SEARCH_CONSOLE_SCOPE];
}

export function parseIntegrationFromPath(
  segment: string,
): GoogleIntegrationKind | null {
  if (segment === "analytics") return "google_analytics";
  if (segment === "seo") return "google_search_console";
  return null;
}

export function integrationPathSegment(integration: GoogleIntegrationKind): string {
  return INTEGRATION_PATH[integration];
}
