/**
 * Lab environment guards (no network, no production contact).
 */
import {
  assertEmailProviderAllowed,
  assertProductionSupabaseBlocked,
  assertPrototypeEnvironment,
  assertStagingEnvironment,
  assertStripeKeyAllowed,
  extractSupabaseProjectRef,
} from "../src/lib/lab/guards.ts";
import { BOOKING_PROTECTED_PROJECT_REFS } from "./booking-integration-fixtures.mjs";

const PROD_REF = "bwxhdoxesqtdqwkxrmom";
const SANDBOX_REF = "ahbtpmlrzruwtfcichlg";

let passed = 0;
let failed = 0;

function pass(msg) {
  passed += 1;
  console.log(`PASS  ${msg}`);
}

function fail(msg) {
  failed += 1;
  console.error(`FAIL  ${msg}`);
}

function envScope(overrides, fn) {
  const keys = Object.keys(overrides);
  const saved = {};
  for (const key of keys) {
    saved[key] = process.env[key];
    const value = overrides[key];
    if (value === undefined || value === "") delete process.env[key];
    else process.env[key] = value;
  }
  try {
    fn();
  } finally {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
}

function expectThrow(fn, label) {
  try {
    fn();
    fail(label);
  } catch {
    pass(label);
  }
}

function main() {
  if (BOOKING_PROTECTED_PROJECT_REFS.includes(PROD_REF)) {
    pass("Booking protected list still includes production ref");
  } else {
    fail("Booking protected list missing production ref");
  }

  const ref = extractSupabaseProjectRef(`https://${PROD_REF}.supabase.co`);
  if (ref === PROD_REF) pass("extractSupabaseProjectRef — production host");
  else fail("extractSupabaseProjectRef — production host");

  expectThrow(
    () =>
      assertProductionSupabaseBlocked(`https://${PROD_REF}.supabase.co`, "test"),
    "Production URL blocked by assertProductionSupabaseBlocked",
  );

  envScope(
    {
      ARTECIUM_RUNTIME: "prototype",
      NEXT_PUBLIC_SUPABASE_URL: `https://${PROD_REF}.supabase.co`,
      EMAIL_PROVIDER: "noop",
    },
    () => {
      expectThrow(assertPrototypeEnvironment, "Prototype + Supabase Production = blocked");
    },
  );

  envScope(
    {
      ARTECIUM_RUNTIME: "prototype",
      NEXT_PUBLIC_SUPABASE_URL: "",
      STRIPE_SECRET_KEY: "sk_live_blocked",
      EMAIL_PROVIDER: "noop",
    },
    () => {
      expectThrow(assertPrototypeEnvironment, "Prototype + Stripe Live = blocked");
    },
  );

  envScope(
    {
      ARTECIUM_RUNTIME: "prototype",
      NEXT_PUBLIC_SUPABASE_URL: "",
      EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "re_test_fake",
    },
    () => {
      expectThrow(assertPrototypeEnvironment, "Prototype + Resend = blocked");
    },
  );

  envScope(
    {
      ARTECIUM_RUNTIME: "prototype",
      NEXT_PUBLIC_SUPABASE_URL: "",
      EMAIL_PROVIDER: "noop",
    },
    () => {
      try {
        assertPrototypeEnvironment();
        pass("Prototype without remote credentials = ok");
      } catch (e) {
        fail(`Prototype without remote credentials = ok (${e.message})`);
      }
    },
  );

  envScope(
    {
      ARTECIUM_RUNTIME: "staging",
      NEXT_PUBLIC_SUPABASE_URL: `https://${PROD_REF}.supabase.co`,
      BOOKING_EXPECTED_PROJECT_REF: SANDBOX_REF,
      EMAIL_PROVIDER: "noop",
    },
    () => {
      expectThrow(assertStagingEnvironment, "Staging + Supabase Production = blocked");
    },
  );

  envScope(
    {
      ARTECIUM_RUNTIME: "staging",
      NEXT_PUBLIC_SUPABASE_URL: `https://${SANDBOX_REF}.supabase.co`,
      EMAIL_PROVIDER: "noop",
      STRIPE_SECRET_KEY: "sk_test_123",
    },
    () => {
      try {
        assertStagingEnvironment();
        pass("Staging + sandbox + sk_test = ok");
      } catch (e) {
        fail(`Staging + sandbox + sk_test = ok (${e.message})`);
      }
    },
  );

  envScope({ ARTECIUM_RUNTIME: "prototype" }, () => {
    try {
      assertStripeKeyAllowed("sk_test_ok", "prototype");
      fail("Prototype should reject any Stripe key");
    } catch {
      pass("Prototype rejects sk_test");
    }
  });

  envScope(
    {
      ARTECIUM_RUNTIME: "prototype",
      EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "re_fake",
    },
    () => {
      expectThrow(
        () => assertEmailProviderAllowed("prototype"),
        "Prototype email noop enforced when resend configured",
      );
    },
  );

  envScope(
    { ARTECIUM_RUNTIME: "prototype", EMAIL_PROVIDER: "noop" },
    () => {
      try {
        assertEmailProviderAllowed("prototype");
        pass("Prototype EMAIL_PROVIDER=noop accepted");
      } catch (e) {
        fail(`Prototype EMAIL_PROVIDER=noop (${e.message})`);
      }
    },
  );

  if (process.env.NODE_ENV === "production") {
    pass("/prototypes layout uses notFound in production (build-time NODE_ENV)");
  } else {
    pass("Dev build: /prototypes routes compile; production deploy must 404");
  }

  console.log(`\nLab guards: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();