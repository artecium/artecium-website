/**
 * Sync email-related env from .env.local to Vercel Production (no stdout secrets).
 * BOOKING_SYNC_VERCEL_EMAIL_ENV=1 node scripts/sync-email-env-vercel-production.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const KEYS = [
  "EMAIL_PROVIDER",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "BOOKING_EMAIL_FROM",
];

if (process.env.BOOKING_SYNC_VERCEL_EMAIL_ENV !== "1") {
  console.log("Skip: BOOKING_SYNC_VERCEL_EMAIL_ENV=1");
  process.exit(0);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const path = resolve(root, ".env.local");
if (!existsSync(path)) {
  console.error("Missing .env.local");
  process.exit(1);
}

const found = new Map();
for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  const key = t.slice(0, eq).trim();
  if (!KEYS.includes(key)) continue;
  let value = t.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  if (value) found.set(key, value);
}

if (!found.has("EMAIL_PROVIDER") || !found.has("RESEND_API_KEY")) {
  console.error("Missing EMAIL_PROVIDER or RESEND_API_KEY in .env.local");
  process.exit(1);
}

const results = [];
for (const key of KEYS) {
  const value = found.get(key);
  if (!value) {
    results.push({ key, status: "skipped_absent_local" });
    continue;
  }
  const sensitive = key.includes("KEY") || key.includes("SECRET");
  const args = [
    "vercel",
    "env",
    "add",
    key,
    "--environment",
    "production",
    "--scope",
    "arteciumhq",
    "--yes",
    "--value",
    value,
  ];
  if (sensitive) args.push("--sensitive");
  const r = spawnSync("npx", args, {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });
  const out = (r.stdout?.toString() ?? "") + (r.stderr?.toString() ?? "");
  const status = r.status === 0 || /already exists|Overwriting/i.test(out) ? "ok" : "fail";
  results.push({ key, status, hint: status === "fail" ? out.slice(0, 200) : undefined });
}

console.log(JSON.stringify({ synced: results }, null, 2));
const failed = results.filter((r) => r.status === "fail");
process.exit(failed.length ? 1 : 0);