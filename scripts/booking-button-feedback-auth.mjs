/**
 * Playwright smoke: BookingButton loading / success / error / double-click (authenticated).
 * Requires: dev server on TEST_BASE_URL, BOOKING_TEST_PASSWORD, integration or demo owner access.
 *
 * node scripts/booking-button-feedback-auth.mjs
 */
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { BOOKING_TEST_PASSWORD_ENV, BOOKING_TEST_USERS } from "./booking-integration-fixtures.mjs";
import {
  assertBookingExplicitSandboxEnv,
  assertLocalBookingTestEnabled,
} from "./booking-test-guards.mjs";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const EMAIL =
  process.env.BOOKING_BUTTON_TEST_EMAIL ??
  (process.env.DEMO_OWNER_PASSWORD
    ? "demo.owner@artecium.test"
    : BOOKING_TEST_USERS.ownerA.email);
const PASSWORD =
  EMAIL === "demo.owner@artecium.test"
    ? process.env.DEMO_OWNER_PASSWORD
    : process.env[BOOKING_TEST_PASSWORD_ENV];

function authCookieName(url) {
  const ref = new URL(url).hostname.split(".")[0];
  return `sb-${ref}-auth-token`;
}

async function getSessionCookie() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anon || !PASSWORD) throw new Error("Missing Supabase env or password.");
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (error || !data.session) throw new Error(error?.message ?? "login failed");
  return {
    name: authCookieName(url),
    value: JSON.stringify(data.session),
    domain: new URL(BASE).hostname,
    path: "/",
    sameSite: "Lax",
  };
}

const results = [];
function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  const usesDemo = EMAIL === "demo.owner@artecium.test" && Boolean(process.env.DEMO_OWNER_PASSWORD);
  if (!usesDemo) {
    assertLocalBookingTestEnabled("BOOKING_BUTTON_FEEDBACK_AUTH");
    assertBookingExplicitSandboxEnv();
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.addCookies([await getSessionCookie()]);
    const page = await context.newPage();

    const actionPosts = [];
    page.on("request", (req) => {
      if (
        req.method() === "POST" &&
        req.url().includes("/client/booking/services") &&
        req.headers()["next-action"]
      ) {
        actionPosts.push(req);
      }
    });

    await page.goto(`${BASE}/client/booking/services`, { waitUntil: "networkidle" });
    if (page.url().includes("/login")) {
      throw new Error("Session cookie rejected — still on login");
    }

    const saveBtn = page.locator('button[data-booking-button-state]').filter({ hasText: /Guardar|Save/i }).first();
    await saveBtn.waitFor({ state: "visible", timeout: 20000 });

    // Error: empty required name on first service row
    const nameInput = page.locator('form input[name="name"]').first();
    const original = await nameInput.inputValue();
    await nameInput.fill("");
    await saveBtn.click();
    await page.waitForTimeout(800);
    const errAlert = page.locator('[role="alert"]');
    const hadError = (await errAlert.count()) > 0;
    const idleAfterError = (await saveBtn.getAttribute("data-booking-button-state")) === "idle";
    record(
      "error state — alert + button idle",
      hadError && idleAfterError,
      hadError ? "alert shown" : "no alert",
    );

    await nameInput.fill(original);

    const durationInput = page.locator('form input[name="duration_minutes"]').first();
    const durationBefore = await durationInput.inputValue();
    const durationNext = String(Math.max(5, (parseInt(durationBefore, 10) || 30) + 1));

    actionPosts.length = 0;
    await durationInput.fill(durationNext);

    const statesSeen = [];
    const poll = setInterval(async () => {
      const s = await saveBtn.getAttribute("data-booking-button-state");
      if (s) statesSeen.push(s);
    }, 40);

    await saveBtn.click();
    await page.waitForSelector('button[data-booking-button-state="success"]', { timeout: 45000 });
    clearInterval(poll);
    record("success state — data-booking-button-state=success", true);
    record(
      "loading state — saw loading in transition",
      statesSeen.includes("loading") || statesSeen.includes("success"),
      statesSeen.join("→") || "none",
    );
    await page.waitForSelector('button[data-booking-button-state="idle"]', { timeout: 5000 });

    actionPosts.length = 0;
    await durationInput.fill(String(parseInt(durationNext, 10) + 1));
    await saveBtn.dblclick();
    await page.waitForTimeout(1200);
    const postsAfterDbl = actionPosts.length;
    record(
      "double-click — at most one action POST",
      postsAfterDbl <= 1,
      `posts=${postsAfterDbl}`,
    );

    actionPosts.length = 0;
    await durationInput.fill(durationBefore);
    await saveBtn.click();
    await page.waitForSelector('button[data-booking-button-state="success"]', { timeout: 45000 }).catch(() => {});
  } finally {
    await browser?.close();
  }

  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error("FAIL  script", e.message);
  process.exit(1);
});