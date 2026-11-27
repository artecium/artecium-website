/**
 * Starts Next.js dev with lab env file (cross-platform).
 * Usage: node scripts/run-lab-dev.mjs prototype|staging [--port 3000]
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const mode = process.argv[2];
const portArg = process.argv.find((a) => a.startsWith("--port="));
const port = portArg?.split("=")[1] ?? "3000";

if (mode !== "prototype" && mode !== "staging") {
  console.error("Usage: node scripts/run-lab-dev.mjs prototype|staging [--port=3000]");
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envFile =
  mode === "prototype"
    ? resolve(root, ".env.prototype.local")
    : resolve(root, ".env.staging.local");

if (!existsSync(envFile)) {
  const example =
    mode === "prototype" ? ".env.prototype.local.example" : ".env.staging.local.example";
  console.error(`Missing ${envFile}. Copy from ${example} first.`);
  process.exit(1);
}

const parsed = Object.fromEntries(
  readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      if (i === -1) return [line, ""];
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);

const labEnv = {
  ...parsed,
  ARTECIUM_RUNTIME: mode,
  NEXT_PUBLIC_ARTECIUM_RUNTIME: mode,
  ...(mode === "prototype"
    ? { ARTECIUM_LAB: "1", NEXT_PUBLIC_ARTECIUM_LAB: "1" }
    : { NEXT_PUBLIC_ARTECIUM_LAB: "0" }),
};

const nextBin = resolve(root, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, "dev", "-p", port], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    ...labEnv,
    /** Prevent accidental merge of production Supabase when prototyping. */
    ...(mode === "prototype"
      ? {
          NEXT_PUBLIC_SUPABASE_URL: labEnv.NEXT_PUBLIC_SUPABASE_URL ?? "",
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
            labEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
          SUPABASE_SERVICE_ROLE_KEY: labEnv.SUPABASE_SERVICE_ROLE_KEY ?? "",
          STRIPE_SECRET_KEY: "",
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
          STRIPE_WEBHOOK_SECRET: "",
          EMAIL_PROVIDER: labEnv.EMAIL_PROVIDER ?? "noop",
          RESEND_API_KEY: "",
        }
      : {}),
  },
});

child.on("exit", (code) => process.exit(code ?? 0));