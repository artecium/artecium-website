import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const path = ".env.local";
if (!existsSync(path)) process.exit(1);
let from;
for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
  const m = line.match(/^EMAIL_FROM=(.*)$/);
  if (m) from = m[1].trim().replace(/^["']|["']$/g, "");
}
if (!from) {
  console.error("no EMAIL_FROM");
  process.exit(1);
}
const r = spawnSync(
  "npx",
  [
    "vercel",
    "env",
    "add",
    "EMAIL_FROM",
    "--environment",
    "production",
    "--scope",
    "arteciumhq",
    "--yes",
    "--force",
  ],
  { input: from, stdio: ["pipe", "pipe", "pipe"], shell: true },
);
console.log(JSON.stringify({ status: r.status === 0 ? "ok" : "fail" }));
process.exit(r.status === 0 ? 0 : 1);