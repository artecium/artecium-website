import { getDiscoveryEmailSubject, renderDiscoveryBriefHtml } from "@/lib/email/render";
import { createResendProvider } from "@/lib/email/providers/resend";
import { createSendGridProvider } from "@/lib/email/providers/sendgrid";
import { createSesProvider } from "@/lib/email/providers/ses";
import type { EmailProvider } from "@/lib/email/types";
import type { ProjectDiscoveryData } from "@/types/project";

function resolveProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER?.toLowerCase();

  switch (provider) {
    case "resend": {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) throw new Error("RESEND_API_KEY is not set");
      return createResendProvider(apiKey);
    }
    case "sendgrid": {
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) throw new Error("SENDGRID_API_KEY is not set");
      return createSendGridProvider(apiKey);
    }
    case "ses":
      return createSesProvider();
    default:
      throw new Error(
        "EMAIL_PROVIDER is not configured. Set to resend, sendgrid, or ses.",
      );
  }
}

export async function sendDiscoveryEmail(data: ProjectDiscoveryData) {
  const inbox = process.env.DISCOVERY_INBOX;
  if (!inbox) {
    throw new Error("DISCOVERY_INBOX is not set");
  }

  const provider = resolveProvider();

  return provider.send({
    to: inbox,
    replyTo: data.email,
    subject: getDiscoveryEmailSubject(data),
    html: renderDiscoveryBriefHtml(data),
  });
}
