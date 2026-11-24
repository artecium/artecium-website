/**
 * One-shot: create .env.booking.prod.local from .env.local (prod ref only). Does not print secrets.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { extractSupabaseProjectRef } from "./booking-test-guards.mjs";

const PROD = "bwxhdoxesqtdqwkxrmom";
const src = ".env.local";
const dst = ".env.booking.prod.local";

if (!existsSync(src)) {
  console.error("Missing .env.local");
  process.exit(1);
}
const parsed = {};
for (const line of readFileSync(src, "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  parsed[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
}
const url = (parsed.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/^["']|["']$/g, "");
const ref = extractSupabaseProjectRef(url);
if (ref !== PROD) {
  console.error(`Refuse: .env.local ref is ${ref}, expected ${PROD}`);
  process.exit(1);
}
const keys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_PASSWORD",
  "DATABASE_URL",
  "RESEND_API_KEY",
  "BOOKING_EMAIL_FROM",
  "EMAIL_FROM",
];
const lines = [
  "# Auto-generated for Booking prod go-live — do not commit",
  "BOOKING_PROD_READONLY=1",
  `BOOKING_PROD_PROJECT_REF=${PROD}`,
  `BOOKING_EXPECTED_PROJECT_REF=${PROD}`,
  "",
];
for (const k of keys) {
  if (parsed[k]) lines.push(`${k}=${parsed[k]}`);
}
writeFileSync(dst, lines.join("\n") + "\n", "utf8");
console.log(JSON.stringify({ ok: true, dst, ref, keysCopied: keys.filter((k) => parsed[k]).length }));