/**
 * Sends one email to Resend's deliverability test address (no customer inbox).
 * BOOKING_RESEND_SAFE_PROBE=1 node scripts/resend-safe-probe.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const TO = "delivered@resend.dev";

if (process.env.BOOKING_RESEND_SAFE_PROBE !== "1") {
  console.log("Skip: BOOKING_RESEND_SAFE_PROBE=1");
  process.exit(0);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const path = resolve(root, ".env.local");
if (!existsSync(path)) process.exit(1);

const env = {};
for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
  const m = line.match(/^(EMAIL_PROVIDER|RESEND_API_KEY|EMAIL_FROM|BOOKING_EMAIL_FROM)=(.*)$/);
  if (!m) continue;
  env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

if (env.EMAIL_PROVIDER?.toLowerCase() !== "resend" || !env.RESEND_API_KEY) {
  console.error("Need EMAIL_PROVIDER=resend and RESEND_API_KEY");
  process.exit(1);
}

const from = env.BOOKING_EMAIL_FROM || env.EMAIL_FROM;
if (!from) {
  console.error("Need EMAIL_FROM or BOOKING_EMAIL_FROM");
  process.exit(1);
}

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${env.RESEND_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from,
    to: TO,
    subject: "Artecium booking launch probe (safe)",
    html: "<p>Automated Resend probe — not customer-facing.</p>",
  }),
});

if (!res.ok) {
  console.log(JSON.stringify({ ok: false, status: res.status, body: (await res.text()).slice(0, 300) }));
  process.exit(1);
}

const json = await res.json();
console.log(JSON.stringify({ ok: true, to: TO, id: json.id ?? null }));