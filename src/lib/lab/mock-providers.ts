import { getArteciumRuntime } from "@/lib/lab/runtime";

export type MockEmailPayload = {
  to: string;
  subject: string;
  html?: string;
};

export type MockEmailResult = { id: string; noop: true };

/**
 * Prototype/staging-safe email — never calls Resend when runtime forbids it.
 */
export async function labSafeSendEmail(
  _payload: MockEmailPayload,
): Promise<MockEmailResult | null> {
  const runtime = getArteciumRuntime();
  if (runtime === "prototype") {
    return { id: `lab-noop-${Date.now()}`, noop: true };
  }
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (runtime === "staging" && (!provider || provider === "noop")) {
    return { id: `staging-noop-${Date.now()}`, noop: true };
  }
  return null;
}

export function isLabStripeDisabled(): boolean {
  return getArteciumRuntime() === "prototype";
}