/**
 * Verify SUPABASE_SERVICE_ROLE_KEY JWT role claim (never prints the key).
 *
 * Usage:
 *   SUPABASE_KEY_ROLE_CHECK=1 node --env-file=.env.booking.test.local scripts/verify-supabase-service-role-key.mjs
 *   SUPABASE_KEY_ROLE_CHECK=1 node --env-file=.env.local scripts/verify-supabase-service-role-key.mjs
 */

function decodeJwtPayload(token) {
  const parts = token.trim().split(".");
  if (parts.length < 2) return null;
  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function main() {
  if (process.env.SUPABASE_KEY_ROLE_CHECK !== "1") {
    console.log("Skip: set SUPABASE_KEY_ROLE_CHECK=1 to run.");
    process.exit(0);
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    console.error("FAIL  SUPABASE_SERVICE_ROLE_KEY is not set.");
    process.exit(1);
  }

  if (key.startsWith("sb_secret_")) {
    console.log("Key format: sb_secret_* (opaque Supabase secret — not a JWT).");
    console.log(
      "MANUAL  Confirm in Dashboard → Project Settings → API that this value is the service_role secret, not the publishable key.",
    );
    process.exit(2);
  }

  if (!key.startsWith("eyJ")) {
    console.error(
      "FAIL  Key is not JWT-shaped (expected eyJ…) nor sb_secret_* — check for placeholders or wrong variable.",
    );
    process.exit(1);
  }

  const payload = decodeJwtPayload(key);
  if (!payload || typeof payload !== "object") {
    console.error("FAIL  Could not decode JWT payload.");
    process.exit(1);
  }

  const role = payload.role;
  const iss = typeof payload.iss === "string" ? payload.iss : "(unknown iss)";

  console.log(`JWT role claim: ${role ?? "(missing)"}`);
  console.log(`JWT iss: ${iss}`);

  if (role === "service_role") {
    console.log("PASS  SUPABASE_SERVICE_ROLE_KEY has role=service_role");
    process.exit(0);
  }

  if (role === "anon") {
    console.error(
      "FAIL  Key has role=anon — likely the publishable/anon key was set in SUPABASE_SERVICE_ROLE_KEY.",
    );
    process.exit(1);
  }

  console.error(`FAIL  Expected role=service_role, got ${String(role)}.`);
  process.exit(1);
}

main();
