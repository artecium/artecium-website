import { createHmac, timingSafeEqual } from "node:crypto";

export type GoogleIntegrationKind = "google_analytics" | "google_search_console";

export function signOAuthStatePayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function buildSignedOAuthStateParameter(
  stateId: string,
  integration: GoogleIntegrationKind,
  secret: string,
): string {
  const payload = `${stateId}.${integration}`;
  return `${payload}.${signOAuthStatePayload(payload, secret)}`;
}

export function verifySignedStateParameter(
  stateParam: string,
  secret: string,
): { stateId: string; integration: GoogleIntegrationKind } | null {
  const parts = stateParam.split(".");
  if (parts.length !== 3) return null;

  const [stateId, integration, signature] = parts;
  if (
    integration !== "google_analytics" &&
    integration !== "google_search_console"
  ) {
    return null;
  }

  const payload = `${stateId}.${integration}`;
  const expected = signOAuthStatePayload(payload, secret);

  try {
    const a = Buffer.from(signature, "base64url");
    const b = Buffer.from(expected, "base64url");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }
  } catch {
    return null;
  }

  if (!/^[0-9a-f-]{36}$/i.test(stateId)) return null;

  return { stateId, integration };
}
