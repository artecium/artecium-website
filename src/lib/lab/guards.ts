import {
  ARTECIUM_SUPABASE_PRODUCTION_REF,
  ARTECIUM_SUPABASE_SANDBOX_REF,
} from "@/lib/lab/constants";
import { getArteciumRuntime, type ArteciumRuntime } from "@/lib/lab/runtime";

export class LabGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LabGuardError";
  }
}

export function extractSupabaseProjectRef(url: string | undefined): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim().replace(/\/+$/, "");
  const hosted = trimmed.match(/^https?:\/\/([a-z0-9]{20})\.supabase\.co$/i);
  return hosted ? hosted[1].toLowerCase() : null;
}

export function isHostedSupabaseUrl(url: string | undefined): boolean {
  return extractSupabaseProjectRef(url) !== null;
}

export function assertProductionSupabaseBlocked(
  url: string | undefined,
  context: string,
): void {
  const ref = extractSupabaseProjectRef(url);
  if (ref === ARTECIUM_SUPABASE_PRODUCTION_REF) {
    throw new LabGuardError(
      `${context}: Supabase Production (${ARTECIUM_SUPABASE_PRODUCTION_REF}) is blocked.`,
    );
  }
}

export function assertStripeKeyAllowed(
  secretKey: string | undefined,
  runtime: ArteciumRuntime,
): void {
  const key = secretKey?.trim();
  if (!key) return;

  if (key.startsWith("sk_live")) {
    throw new LabGuardError(
      `Stripe Live keys are forbidden in ${runtime}.`,
    );
  }

  if (runtime === "prototype") {
    throw new LabGuardError(
      "Prototype must not configure Stripe. Remove STRIPE_SECRET_KEY.",
    );
  }

  if (runtime === "staging" && !key.startsWith("sk_test")) {
    throw new LabGuardError(
      "Staging only allows Stripe test keys (sk_test_*).",
    );
  }
}

export function assertEmailProviderAllowed(runtime: ArteciumRuntime): void {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (!provider || provider === "noop" || provider === "disabled") {
    return;
  }

  if (runtime === "prototype") {
    throw new LabGuardError(
      'Prototype requires EMAIL_PROVIDER=noop (no real emails).',
    );
  }

  if (runtime === "staging" && provider === "resend") {
    const allow = process.env.ARTECIUM_STAGING_ALLOW_EMAIL?.trim();
    if (allow !== "1") {
      throw new LabGuardError(
        "Staging blocks Resend by default. Set EMAIL_PROVIDER=noop or ARTECIUM_STAGING_ALLOW_EMAIL=1.",
      );
    }
  }
}

/** Fail-closed checks for ARTECIUM_RUNTIME=prototype at server boot / lab layout. */
export function assertPrototypeEnvironment(): void {
  const runtime = getArteciumRuntime();
  if (runtime !== "prototype") return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  assertProductionSupabaseBlocked(url, "Prototype");

  if (url && isHostedSupabaseUrl(url)) {
    throw new LabGuardError(
      "Prototype cannot use hosted Supabase. Leave NEXT_PUBLIC_SUPABASE_URL empty or use local loopback only.",
    );
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    throw new LabGuardError(
      "Prototype cannot use SUPABASE_SERVICE_ROLE_KEY. Remove it from .env.prototype.local.",
    );
  }

  assertStripeKeyAllowed(process.env.STRIPE_SECRET_KEY, "prototype");
  assertEmailProviderAllowed("prototype");
}

/** Fail-closed checks for ARTECIUM_RUNTIME=staging. */
export function assertStagingEnvironment(): void {
  const runtime = getArteciumRuntime();
  if (runtime !== "staging") return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  assertProductionSupabaseBlocked(url, "Staging");

  const ref = extractSupabaseProjectRef(url);
  if (ref !== ARTECIUM_SUPABASE_SANDBOX_REF) {
    throw new LabGuardError(
      `Staging requires sandbox ref ${ARTECIUM_SUPABASE_SANDBOX_REF} in NEXT_PUBLIC_SUPABASE_URL.`,
    );
  }

  assertStripeKeyAllowed(process.env.STRIPE_SECRET_KEY, "staging");
  assertEmailProviderAllowed("staging");
}

export function assertLabRuntimeEnvironment(): void {
  const runtime = getArteciumRuntime();
  if (runtime === "prototype") assertPrototypeEnvironment();
  if (runtime === "staging") assertStagingEnvironment();
}