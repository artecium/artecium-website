import "server-only";

import { google } from "googleapis";

import {
  getGoogleOAuthClientId,
  getGoogleOAuthClientSecret,
  getGoogleOAuthRedirectUri,
  scopesForIntegration,
  type GoogleIntegrationKind,
} from "@/lib/google/config";
import {
  getGoogleOAuthTokenById,
  updateGoogleAccessTokenCache,
  type StoredGoogleToken,
} from "@/lib/google/token-store";

function createOAuth2Client(integration: GoogleIntegrationKind) {
  return new google.auth.OAuth2(
    getGoogleOAuthClientId(),
    getGoogleOAuthClientSecret(),
    getGoogleOAuthRedirectUri(integration),
  );
}

export function buildGoogleAuthorizationUrl(
  integration: GoogleIntegrationKind,
  state: string,
): string {
  const client = createOAuth2Client(integration);
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: scopesForIntegration(integration),
    state,
  });
}

export async function exchangeGoogleAuthorizationCode(
  integration: GoogleIntegrationKind,
  code: string,
): Promise<{
  refreshToken: string;
  accessToken: string | null;
  expiresAt: string | null;
  scopes: string[];
}> {
  const client = createOAuth2Client(integration);
  const { tokens } = await client.getToken(code);

  const refreshToken = tokens.refresh_token;
  if (!refreshToken) {
    throw new Error("Google did not return a refresh token. Try again with consent.");
  }

  const expiresAt =
    tokens.expiry_date != null
      ? new Date(tokens.expiry_date).toISOString()
      : null;

  const scopes =
    typeof tokens.scope === "string"
      ? tokens.scope.split(" ").filter(Boolean)
      : scopesForIntegration(integration);

  return {
    refreshToken,
    accessToken: tokens.access_token ?? null,
    expiresAt,
    scopes,
  };
}

export async function revokeGoogleTokenAtProvider(refreshOrAccessToken: string): Promise<void> {
  const client = createOAuth2Client("google_analytics");
  try {
    await client.revokeToken(refreshOrAccessToken);
  } catch {
    // Provider may already have revoked — local revoke still proceeds.
  }
}

export async function fetchGoogleAccountProfile(accessToken: string): Promise<{
  email: string | null;
  sub: string | null;
}> {
  const client = createOAuth2Client("google_analytics");
  client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();
  return {
    email: data.email ?? null,
    sub: data.id ?? null,
  };
}

function accessTokenExpired(token: StoredGoogleToken): boolean {
  if (!token.accessToken || !token.accessTokenExpiresAt) return true;
  return new Date(token.accessTokenExpiresAt).getTime() <= Date.now() + 60_000;
}

export async function getValidGoogleAccessToken(
  token: StoredGoogleToken,
  integration: GoogleIntegrationKind,
): Promise<string> {
  if (!accessTokenExpired(token)) {
    return token.accessToken!;
  }

  const client = createOAuth2Client(integration);
  client.setCredentials({ refresh_token: token.refreshToken });

  const { credentials } = await client.refreshAccessToken();
  const accessToken = credentials.access_token;
  if (!accessToken) {
    throw new Error("Google token refresh failed.");
  }

  const expiresAt =
    credentials.expiry_date != null
      ? new Date(credentials.expiry_date).toISOString()
      : new Date(Date.now() + 3500 * 1000).toISOString();

  await updateGoogleAccessTokenCache(token.id, accessToken, expiresAt);
  return accessToken;
}

export async function getOAuthClientForStoredToken(
  tokenId: string,
  integration: GoogleIntegrationKind,
) {
  const stored = await getGoogleOAuthTokenById(tokenId);
  if (!stored) {
    throw new Error("Google authorization not found.");
  }
  if (stored.integration !== integration) {
    throw new Error("Integration mismatch.");
  }

  const accessToken = await getValidGoogleAccessToken(stored, integration);
  const client = createOAuth2Client(integration);
  client.setCredentials({
    access_token: accessToken,
    refresh_token: stored.refreshToken,
  });
  return { client, stored };
}
