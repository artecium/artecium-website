import "server-only";

import type { GoogleIntegrationKind } from "@/lib/google/config";
import { createAdminClient } from "@/lib/supabase/admin";

export interface StoredGoogleToken {
  id: string;
  companyId: string;
  integration: GoogleIntegrationKind;
  refreshToken: string;
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  scopes: string[];
  googleAccountEmail: string | null;
  googleAccountSub: string | null;
  revokedAt: string | null;
}

export interface UpsertGoogleTokenInput {
  companyId: string;
  integration: GoogleIntegrationKind;
  refreshToken: string;
  accessToken?: string | null;
  accessTokenExpiresAt?: string | null;
  scopes: string[];
  googleAccountEmail?: string | null;
  googleAccountSub?: string | null;
}

function mapRow(row: Record<string, unknown>): StoredGoogleToken {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    integration: row.integration as GoogleIntegrationKind,
    refreshToken: row.refresh_token as string,
    accessToken: (row.access_token as string | null) ?? null,
    accessTokenExpiresAt: (row.access_token_expires_at as string | null) ?? null,
    scopes: (row.scopes as string[]) ?? [],
    googleAccountEmail: (row.google_account_email as string | null) ?? null,
    googleAccountSub: (row.google_account_sub as string | null) ?? null,
    revokedAt: (row.revoked_at as string | null) ?? null,
  };
}

export async function upsertGoogleOAuthToken(
  input: UpsertGoogleTokenInput,
): Promise<StoredGoogleToken> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from("google_oauth_tokens")
    .upsert(
      {
        company_id: input.companyId,
        integration: input.integration,
        refresh_token: input.refreshToken,
        access_token: input.accessToken ?? null,
        access_token_expires_at: input.accessTokenExpiresAt ?? null,
        scopes: input.scopes,
        google_account_email: input.googleAccountEmail ?? null,
        google_account_sub: input.googleAccountSub ?? null,
        revoked_at: null,
        updated_at: now,
      },
      { onConflict: "company_id,integration" },
    )
    .select(
      "id, company_id, integration, refresh_token, access_token, access_token_expires_at, scopes, google_account_email, google_account_sub, revoked_at",
    )
    .single();

  if (error || !data) {
    throw new Error("Unable to store Google authorization.");
  }

  return mapRow(data as Record<string, unknown>);
}

export async function getGoogleOAuthTokenById(
  tokenId: string,
): Promise<StoredGoogleToken | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("google_oauth_tokens")
    .select(
      "id, company_id, integration, refresh_token, access_token, access_token_expires_at, scopes, google_account_email, google_account_sub, revoked_at",
    )
    .eq("id", tokenId)
    .maybeSingle();

  if (error || !data) return null;
  const token = mapRow(data as Record<string, unknown>);
  if (token.revokedAt) return null;
  return token;
}

export async function getGoogleOAuthTokenForCompany(
  companyId: string,
  integration: GoogleIntegrationKind,
): Promise<StoredGoogleToken | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("google_oauth_tokens")
    .select(
      "id, company_id, integration, refresh_token, access_token, access_token_expires_at, scopes, google_account_email, google_account_sub, revoked_at",
    )
    .eq("company_id", companyId)
    .eq("integration", integration)
    .maybeSingle();

  if (error || !data) return null;
  const token = mapRow(data as Record<string, unknown>);
  if (token.revokedAt) return null;
  return token;
}

export async function updateGoogleAccessTokenCache(
  tokenId: string,
  accessToken: string,
  expiresAt: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("google_oauth_tokens")
    .update({
      access_token: accessToken,
      access_token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tokenId)
    .is("revoked_at", null);

  if (error) {
    throw new Error("Unable to refresh Google access token cache.");
  }
}

export async function revokeGoogleOAuthToken(tokenId: string): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin
    .from("google_oauth_tokens")
    .update({
      revoked_at: now,
      access_token: null,
      access_token_expires_at: null,
      updated_at: now,
    })
    .eq("id", tokenId);

  if (error) {
    throw new Error("Unable to revoke Google token record.");
  }
}
