import type { EmailPayload, EmailProvider } from "@/lib/email/types";

export function createSendGridProvider(apiKey: string): EmailProvider {
  return {
    async send(payload: EmailPayload) {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.to }] }],
          from: { email: process.env.EMAIL_FROM },
          reply_to: payload.replyTo ? { email: payload.replyTo } : undefined,
          subject: payload.subject,
          content: [{ type: "text/html", value: payload.html }],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SendGrid error: ${error}`);
      }

      return { id: response.headers.get("x-message-id") ?? "sent" };
    },
  };
}
