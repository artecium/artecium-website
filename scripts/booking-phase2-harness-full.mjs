/**
 * Full local validation: T1–T10 + C1 + digest parity + static verifiers.
 *
 * npm run test:booking-phase2-harness-full
 */

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function runNode(script, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(__dirname, script)], {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${script} exit ${code}`))));
  });
}

async function main() {
  const hash023 = createHash("sha256")
    .update(readFileSync(join(root, "supabase/migrations/023_phase2_harness_persistent_tracking.sql")))
    .digest("hex");
  console.log("023 active hash:", hash023);

  await runNode("booking-phase2-harness-pg-t1-t10.mjs");
  await new Promise((r) => setTimeout(r, 1500));
  await runNode("booking-phase2-harness-digest-sql-parity.mjs");
  await runNpmScript("verify:booking-phase2-persistent-harness");
  await runNpmScript("verify:booking-phase2-incremental-fixtures");
  console.log("PASS  full harness validation completed");
}

function runNpmScript(name) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", name], {
      cwd: root,
      stdio: "inherit",
      shell: true,
    });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${name} exit ${code}`))));
  });
}

main().catch((e) => {
  console.error("FAIL", e.message ?? e);
  process.exit(1);
});
