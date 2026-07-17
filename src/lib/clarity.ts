const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

type ClarityCommand = "event" | "set" | "identify" | "consent";

declare global {
  interface Window {
    clarity?: (command: ClarityCommand, ...args: unknown[]) => void;
  }
}

function isClarityAvailable(): boolean {
  return (
    IS_PRODUCTION &&
    Boolean(CLARITY_PROJECT_ID) &&
    typeof window !== "undefined" &&
    typeof window.clarity === "function"
  );
}

/** Track a custom Clarity smart event. */
export function trackClarityEvent(eventName: string) {
  if (!isClarityAvailable()) return;
  window.clarity!("event", eventName);
}

/** Set a custom Clarity tag for filtering sessions. */
export function setClarityTag(
  key: string,
  value: string | string[] | number | boolean,
) {
  if (!isClarityAvailable()) return;
  window.clarity!("set", key, String(value));
}

/** Identify a signed-in or known user in Clarity (use non-PII IDs when possible). */
export function identifyClarityUser(
  customId: string,
  customSessionId?: string,
  customPageId?: string,
) {
  if (!isClarityAvailable()) return;
  window.clarity!("identify", customId, customSessionId, customPageId);
}

/** Discovery wizard helpers — ready for future integration. */
export function trackStartProject() {
  trackClarityEvent("start_project");
}

export function trackDiscoverySubmitted(method: "email" | "whatsapp") {
  trackClarityEvent("discovery_submitted");
  setClarityTag("contact_method", method);
}

export function trackWhatsAppClick() {
  trackClarityEvent("whatsapp_click");
}

export function trackEmailRequest() {
  trackClarityEvent("email_request");
}

export function isClarityEnabled(): boolean {
  return IS_PRODUCTION && Boolean(CLARITY_PROJECT_ID);
}
