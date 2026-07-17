import { sendGAEvent } from "@next/third-parties/google";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

type AnalyticsEventParams = Record<string, string | number | boolean | undefined>;

function trackEvent(eventName: string, params?: AnalyticsEventParams) {
  if (!GA_MEASUREMENT_ID) return;

  sendGAEvent("event", eventName, {
    send_to: GA_MEASUREMENT_ID,
    ...params,
  });
}

/** Fired when a user opens the Project Discovery Wizard. */
export function trackStartProject() {
  trackEvent("start_project", {
    event_category: "discovery",
    event_label: "wizard_opened",
  });
}

/** Fired when a user completes and submits the Discovery Brief. */
export function trackDiscoverySubmitted(method: "email" | "whatsapp") {
  trackEvent("discovery_submitted", {
    event_category: "discovery",
    event_label: "brief_submitted",
    contact_method: method,
  });
}

/** Fired when a user clicks to continue on WhatsApp. */
export function trackWhatsAppClick() {
  trackEvent("whatsapp_click", {
    event_category: "discovery",
    event_label: "whatsapp_continue",
  });
}

/** Fired when a user sends an email discovery request. */
export function trackEmailRequest() {
  trackEvent("email_request", {
    event_category: "discovery",
    event_label: "email_send_request",
  });
}
