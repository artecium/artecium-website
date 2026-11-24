/**
 * Static guard: booking mutation actions must use requireManageBusiness (or session for onboarding).
 * Usage: npm run verify:booking-actions
 */

import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "src/lib/actions/booking");
const files = fs.readdirSync(dir).filter(
  (f) =>
    f.endsWith(".ts") &&
    f !== "context.ts" &&
    f !== "company-link.ts" &&
    f !== "public.ts",
);

/** @type {{ name: string; pass: boolean; detail?: string }[]} */
const results = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), "utf8");
  const exportsAction = /export async function/.test(content);
  if (!exportsAction) continue;

  const usesManage =
    content.includes("requireManageBusiness") ||
    (file === "business.ts" && content.includes("requireBookingSession")) ||
    (file === "team.ts" && content.includes("requireBookingSession"));

  results.push({
    name: file,
    pass: usesManage,
    detail: usesManage ? "guarded" : "missing requireManageBusiness/requireBookingSession",
  });
}

const passed = results.filter((r) => r.pass).length;
for (const r of results) {
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
}
console.log(`\n${passed}/${results.length} action files guarded`);
if (passed !== results.length) process.exit(1);
