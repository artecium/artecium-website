/**
 * Unit checks for Google OAuth state signing (no live Google credentials required).
 */
import { createHmac, randomUUID } from "node:crypto";

process.env.GOOGLE_OAUTH_STATE_SECRET =
  process.env.GOOGLE_OAUTH_STATE_SECRET || "test-state-secret";

const { verifySignedStateParameter, buildSignedOAuthStateParameter } = await import(
  "../src/lib/google/oauth-state-sign.ts"
);

let passed = 0;
let failed = 0;

function pass(name) {
  passed += 1;
  console.log(`PASS  ${name}`);
}

function fail(name, detail) {
  failed += 1;
  console.error(`FAIL  ${name}${detail ? `: ${detail}` : ""}`);
}

const secret = process.env.GOOGLE_OAUTH_STATE_SECRET;
const stateId = randomUUID();

const valid = buildSignedOAuthStateParameter(stateId, "google_analytics", secret);
const parsed = verifySignedStateParameter(valid, secret);
if (parsed?.stateId === stateId && parsed.integration === "google_analytics") {
  pass("verifySignedStateParameter — valid analytics state");
} else {
  fail("verifySignedStateParameter — valid analytics state");
}

const tampered = `${valid}x`;
if (verifySignedStateParameter(tampered, secret) === null) {
  pass("verifySignedStateParameter — rejects tampered signature");
} else {
  fail("verifySignedStateParameter — rejects tampered signature");
}

const wrongSecretState = buildSignedOAuthStateParameter(
  stateId,
  "google_search_console",
  "other-secret",
);
if (verifySignedStateParameter(wrongSecretState, secret) === null) {
  pass("verifySignedStateParameter — rejects wrong secret");
} else {
  fail("verifySignedStateParameter — rejects wrong secret");
}

if (verifySignedStateParameter("not-valid", secret) === null) {
  pass("verifySignedStateParameter — rejects malformed state");
} else {
  fail("verifySignedStateParameter — rejects malformed state");
}

const actionSource = await import("node:fs/promises").then((fs) =>
  fs.readFile(new URL("../src/lib/actions/admin/google-integrations.ts", import.meta.url), "utf8"),
);
if (!actionSource.includes("refresh_token:") && !actionSource.includes("access_token:")) {
  pass("google-integrations actions — no snake_case token keys in responses");
} else {
  fail("google-integrations actions — snake_case token keys in action module");
}

console.log(`\n${passed} passed, ${failed} failed`);
console.log("PENDING  Live OAuth callback (requires GOOGLE_OAUTH_* and Google Cloud setup)");
console.log("PENDING  consumeOAuthAuthorizationState expiry/reuse (requires Supabase service role)");

if (failed > 0) process.exit(1);
