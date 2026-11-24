/**
 * Public idempotency helper checks (no DB).
 * Usage: npm run verify:booking-idempotency
 */

import {
  buildPublicIdempotencyRequestHash,
  isValidPublicIdempotencyKey,
  sha256HexNode,
} from "../src/lib/booking/public-idempotency.ts";

/** @type {{ name: string; pass: boolean; detail?: string }[]} */
const results = [];

function check(name, condition, detail) {
  results.push({ name, pass: Boolean(condition), detail });
}

async function main() {
  check("valid key", isValidPublicIdempotencyKey("abc12345_--"));
  check("short key invalid", !isValidPublicIdempotencyKey("short"));
  check("empty invalid", !isValidPublicIdempotencyKey(""));

  const payload = buildPublicIdempotencyRequestHash({
    serviceId: "11111111-1111-1111-1111-111111111111",
    staffId: "22222222-2222-2222-2222-222222222222",
    startsAtIso: "2026-06-02T10:00:00.000Z",
  });
  const hash1 = await sha256HexNode(payload);
  const hash2 = await sha256HexNode(payload);
  check("hash stable", hash1 === hash2, hash1);

  const payload2 = buildPublicIdempotencyRequestHash({
    serviceId: "11111111-1111-1111-1111-111111111111",
    staffId: "22222222-2222-2222-2222-222222222222",
    startsAtIso: "2026-06-02T10:15:00.000Z",
  });
  const hash3 = await sha256HexNode(payload2);
  check("different slot different hash", hash1 !== hash3);

  const passed = results.filter((r) => r.pass).length;
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\n${passed}/${results.length} checks passed`);
  if (passed !== results.length) process.exit(1);
}

main();
