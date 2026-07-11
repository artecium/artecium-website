import type { EmailPayload, EmailProvider } from "@/lib/email/types";

/**
 * Amazon SES provider stub.
 * Wire up @aws-sdk/client-ses when SES credentials are configured.
 */
export function createSesProvider(): EmailProvider {
  return {
    async send(payload: EmailPayload) {
      throw new Error(
        `Amazon SES provider is not configured. Set EMAIL_PROVIDER and SES credentials. Attempted to send to ${payload.to}.`,
      );
    },
  };
}
