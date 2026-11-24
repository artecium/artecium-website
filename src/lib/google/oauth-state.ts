import "server-only";

import { randomBytes } from "node:crypto";

import type { GoogleIntegrationKind, GoogleOAuthInitiatorContext } from "@/lib/google/config";
import { getGoogleOAuthStateSecret } from "@/lib/google/config";
import {
  buildSignedOAuthStateParameter,
  verifySignedStateParameter as verifySignedStateWithSecret,
} from "@/lib/google/oauth-state-sign";
import { createAdminClient } from "@/lib/supabase/admin";

const STATE_TTL_MS = 15 * 60 * 1000;

export interface CreateOAuthStateInput {
  integration: GoogleIntegrationKind;
  companyId: string;
  initiatorUserId: string;
  initiatorContext: GoogleOAuthInitiatorContext;
  connectionId?: string | null;
  returnPath?: string | null;
}

export interface VerifiedOAuthState {
  stateId: string;
  integration: GoogleIntegrationKind;
  companyId: string;
  initiatorUserId: string;
  initiatorContext: GoogleOAuthInitiatorContext;
  connectionId: string | null;
  returnPath: string | null;
}

export async function createOAuthAuthorizationState(
  input: CreateOAuthStateInput,
): Promise<string> {
  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + STATE_TTL_MS).toISOString();

  const { data, error } = await admin
    .from("google_oauth_authorization_states")
    .insert({
      integration: input.integration,
      company_id: input.companyId,
      initiator_user_id: input.initiatorUserId,
      initiator_context: input.initiatorContext,
      connection_id: input.connectionId ?? null,
      return_path: input.returnPath ?? null,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error("Unable to start Google authorization.");
  }

  return buildSignedOAuthStateParameter(
    data.id as string,
    input.integration,
    getGoogleOAuthStateSecret(),
  );
}

export async function consumeOAuthAuthorizationState(
  stateParam: string,
  expectedIntegration: GoogleIntegrationKind,
): Promise<VerifiedOAuthState> {
  const parsed = verifySignedStateWithSecret(stateParam, getGoogleOAuthStateSecret());
  if (!parsed || parsed.integration !== expectedIntegration) {
    throw new OAuthStateError("invalid_state");
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: row, error } = await admin
    .from("google_oauth_authorization_states")
    .select(
      "id, integration, company_id, initiator_user_id, initiator_context, connection_id, return_path, expires_at, consumed_at",
    )
    .eq("id", parsed.stateId)
    .maybeSingle();

  if (error || !row) {
    throw new OAuthStateError("invalid_state");
  }

  if (row.consumed_at) {
    throw new OAuthStateError("state_reused");
  }

  if (new Date(row.expires_at as string).getTime() < Date.now()) {
    throw new OAuthStateError("state_expired");
  }

  const { data: consumed, error: consumeError } = await admin
    .from("google_oauth_authorization_states")
    .update({ consumed_at: now })
    .eq("id", parsed.stateId)
    .is("consumed_at", null)
    .select("id")
    .maybeSingle();

  if (consumeError || !consumed) {
    throw new OAuthStateError("state_reused");
  }

  return {
    stateId: row.id as string,
    integration: row.integration as GoogleIntegrationKind,
    companyId: row.company_id as string,
    initiatorUserId: row.initiator_user_id as string,
    initiatorContext: row.initiator_context as GoogleOAuthInitiatorContext,
    connectionId: (row.connection_id as string | null) ?? null,
    returnPath: (row.return_path as string | null) ?? null,
  };
}

export class OAuthStateError extends Error {
  readonly code: "invalid_state" | "state_expired" | "state_reused";

  constructor(code: "invalid_state" | "state_expired" | "state_reused") {
    super(code);
    this.name = "OAuthStateError";
    this.code = code;
  }
}

export function generateOAuthCsrfNonce(): string {
  return randomBytes(16).toString("base64url");
}
