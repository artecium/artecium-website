import "server-only";

import type { BookingAppointmentStatus } from "@/types/booking";

/** Sends guest/business emails when configured. Never throws to callers. */
export async function notifyBookingAppointmentStatusChange(input: {
  guestEmail: string | null;
  businessName: string;
  status: BookingAppointmentStatus;
  publicReference: string | null;
}): Promise<{ sent: boolean; skippedReason?: string }> {
  if (!input.guestEmail?.trim()) {
    return { sent: false, skippedReason: "no_guest_email" };
  }

  if (!process.env.EMAIL_PROVIDER?.trim()) {
    return { sent: false, skippedReason: "email_not_configured" };
  }

  try {
    const { createResendProvider } = await import("@/lib/email/providers/resend");
    const providerName = process.env.EMAIL_PROVIDER.toLowerCase();
    if (providerName !== "resend") {
      return { sent: false, skippedReason: "unsupported_email_provider" };
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.BOOKING_EMAIL_FROM?.trim() || process.env.EMAIL_FROM?.trim();
    if (!apiKey || !from) {
      return { sent: false, skippedReason: "missing_email_credentials" };
    }

    const provider = createResendProvider(apiKey);
    const ref = input.publicReference ? ` (${input.publicReference})` : "";
    const subject = `${input.businessName} — booking ${input.status}${ref}`;
    const html = `<p>Your appointment with <strong>${input.businessName}</strong> is now <strong>${input.status}</strong>.</p>`;

    await provider.send({
      to: input.guestEmail.trim(),
      subject,
      html,
    });

    return { sent: true };
  } catch {
    return { sent: false, skippedReason: "send_failed" };
  }
}
