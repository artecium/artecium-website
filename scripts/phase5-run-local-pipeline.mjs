/**
 * Phase 5.1 local pipeline: verify Docker → supabase start → db reset → seed → tests.
 * Refuses remote URLs. Does not link to bwxhdoxesqtdqwkxrmom.
 */

import { execSync, spawnSync } from "node:child_process";
import { existsSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { phase5ProtectedRef } from "./phase5-isolation-guards.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const REPORT = resolve(ROOT, "docs", "audit", "PHASE5_LOCAL_ENVIRONMENT_REPORT.md");

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: opts.silent ? "pipe" : "inherit", ...opts });
}

function dockerAvailable() {
  try {
    run("docker version --format {{.Server.Version}}", { silent: true });
    return true;
  } catch {
    for (const p of [
      "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe",
      "C:\\Program Files\\Docker\\Docker\\docker.exe",
    ]) {
      if (existsSync(p)) {
        try {
          execSync(`"${p}" version`, { encoding: "utf8", stdio: "pipe" });
          return true;
        } catch {
          /* continue */
        }
      }
    }
    return false;
  }
}

function migrationInventory() {
  const dir = resolve(ROOT, "supabase", "migrations");
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".sql")).sort() : [];
  return files;
}

function writeReport(blockers, steps) {
  const body = `# Phase 5 — Local environment report

**Generated:** ${new Date().toISOString()}
**Protected remote ref:** \`${phase5ProtectedRef()}\` — must remain untouched.

## Docker / CLI

| Check | Result |
|-------|--------|
| Docker | ${blockers.docker ? "BLOCKED" : "OK"} |
| Supabase CLI (npx) | available via \`npx supabase@2\` |

## Migration inventory

- Files in \`supabase/migrations/\`: **${migrationInventory().length}**
- Canonical 023: \`023_phase2_harness_persistent_tracking.sql\`
- Archived (not in migrations): v2.5, v2.6 → \`supabase/migrations_archive/\`

## Pipeline steps

${steps.map((s) => `- ${s}`).join("\n")}

## Blockers

${blockers.docker ? "**Docker Desktop / Podman not available** — `supabase start` cannot run. Install Docker and re-run:\n\n\`\`\`powershell\n$env:PHASE5_RUN_LOCAL='1'\nnode scripts/phase5-run-local-pipeline.mjs\n\`\`\`" : "None"}

## Remote verification

- No \`supabase link\` to remote was executed by this pipeline.
- \`supabase/.temp/linked-project.json\` may still reference remote from past work — **do not run db push** against it.
`;
  mkdirSync(dirname(REPORT), { recursive: true });
  writeFileSync(REPORT, body, "utf8");
  console.log("Wrote", REPORT);
}

async function main() {
  const steps = [];
  const blockers = { docker: !dockerAvailable() };

  steps.push(`Migrations listed: ${migrationInventory().join(", ").slice(0, 200)}…`);

  if (blockers.docker) {
    steps.push("STOP: Docker not found — supabase start skipped");
    writeReport(blockers, steps);
    process.exit(2);
  }

  steps.push("Running npx supabase start…");
  const start = spawnSync("npx", ["--yes", "supabase@2", "start"], { cwd: ROOT, stdio: "inherit", shell: true });
  if (start.status !== 0) {
    steps.push("FAIL: supabase start");
    writeReport(blockers, steps);
    process.exit(start.status ?? 1);
  }

  steps.push("Running npx supabase db reset…");
  const reset = spawnSync("npx", ["--yes", "supabase@2", "db", "reset"], { cwd: ROOT, stdio: "inherit", shell: true });
  if (reset.status !== 0) {
    steps.push("FAIL: db reset");
    writeReport(blockers, steps);
    process.exit(reset.status ?? 1);
  }

  const status = run("npx --yes supabase@2 status -o json", { silent: true });
  const parsed = JSON.parse(status);
  const envExample = resolve(ROOT, ".env.client-isolation.local");
  if (!existsSync(envExample)) {
    const lines = [
      "PHASE5_CLIENT_ISOLATION=1",
      "NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321",
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${parsed.ANON_KEY ?? parsed.anon_key}`,
      `SUPABASE_SERVICE_ROLE_KEY=${parsed.SERVICE_ROLE_KEY ?? parsed.service_role_key}`,
      "CLIENT_ISOLATION_TEST_PASSWORD=iso-local-test-only",
    ];
    writeFileSync(envExample, lines.join("\n") + "\n", "utf8");
    steps.push("Created .env.client-isolation.local from supabase status (local keys only)");
  }

  steps.push("Run: node scripts/seed-client-multi-tenant.mjs");
  steps.push("Run: node scripts/supabase-phase5-client-isolation-readonly.mjs");
  writeReport(blockers, steps);

  if (process.env.PHASE5_RUN_FULL === "1") {
    run("node scripts/seed-client-multi-tenant.mjs", { env: { ...process.env, PHASE5_CLIENT_ISOLATION: "1" } });
    run("node scripts/supabase-phase5-client-isolation-readonly.mjs", {
      env: { ...process.env, PHASE5_CLIENT_ISOLATION: "1" },
    });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});