import type { EmailPayload, EmailProvider } from "@/lib/email/types";

export function createResendProvider(apiKey: string): EmailProvider {
  return {
    async send(payload: EmailPayload) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          reply_to: payload.replyTo,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend error: ${error}`);
      }

      const result = (await response.json()) as { id: string };
      return { id: result.id };
    },
  };
}
