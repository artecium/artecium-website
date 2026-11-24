/**
 * Local smoke: authenticated booking admin pages + public booking (demo.owner).
 * Usage: node scripts/booking-button-smoke-http.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function authCookieName(supabaseUrl) {
  const ref = new URL(supabaseUrl).hostname.split(".")[0];
  return `sb-${ref}-auth-token`;
}

/** @type {{ name: string; path: string; cookie: boolean; check: (html: string, status: number) => boolean }[]} */
const ADMIN_PAGES = [
  {
    name: "dashboard",
    path: "/client/booking/dashboard",
    cookie: true,
    check: (html, status) =>
      status === 200 && (html.includes("Painel") || html.includes("Dashboard")),
  },
  {
    name: "services",
    path: "/client/booking/services",
    cookie: true,
    check: (html, status) => status === 200 && html.includes("min-h-10"),
  },
  {
    name: "staff",
    path: "/client/booking/staff",
    cookie: true,
    check: (html, status) => status === 200 && html.includes("cursor-pointer"),
  },
  {
    name: "appointments",
    path: "/client/booking/appointments",
    cookie: true,
    check: (html, status) => status === 200,
  },
  {
    name: "schedules",
    path: "/client/booking/schedules",
    cookie: true,
    check: (html, status) => status === 200,
  },
  {
    name: "calendar",
    path: "/client/booking/calendar",
    cookie: true,
    check: (html, status) => status === 200,
  },
  {
    name: "settings",
    path: "/client/booking/settings",
    cookie: true,
    check: (html, status) => status === 200,
  },
  {
    name: "public-booking",
    path: "/booking/b/artecium-demo",
    cookie: false,
    check: (html, status) => status === 200 && html.includes("Continuar"),
  },
];

async function main() {
  loadEnvFile(resolve(ROOT, ".env.local"));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const password = process.env.DEMO_OWNER_PASSWORD;
  if (!url || !anonKey || !password) {
    console.error("FAIL missing env");
    process.exit(1);
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "demo.owner@artecium.test",
    password,
  });
  if (error || !data.session) {
    console.error("FAIL login", error?.message);
    process.exit(1);
  }

  const cookie = `${authCookieName(url)}=${encodeURIComponent(JSON.stringify(data.session))}`;
  let failed = 0;

  for (const page of ADMIN_PAGES) {
    const headers = page.cookie ? { Cookie: cookie } : {};
    const res = await fetch(`${BASE}${page.path}`, { headers, redirect: "manual" });
    let body = "";
    if (res.status === 200) body = await res.text();
    if (res.status === 302 && page.path.includes("booking")) {
      const loc = res.headers.get("location") ?? "";
      console.log(`FAIL ${page.name} redirect=${loc}`);
      failed += 1;
      continue;
    }
    const ok = page.check(body, res.status);
    console.log(`${ok ? "OK" : "FAIL"} ${page.name} status=${res.status}`);
    if (!ok) failed += 1;
  }

  // Error-path: update service with invalid id via action is complex; verify button disabled attr in HTML chunks
  const svcHtml = await (
    await fetch(`${BASE}/client/booking/services`, { headers: { Cookie: cookie } })
  ).text();
  const hasBookingButtonChrome =
    svcHtml.includes("border-violet-500/30") && svcHtml.includes("data-booking-button-state");
  console.log(`${hasBookingButtonChrome ? "OK" : "FAIL"} services BookingButton markup`);
  if (!hasBookingButtonChrome) failed += 1;

  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});