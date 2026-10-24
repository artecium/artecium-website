export const COOKIE_CONSENT_NAME = "artecium_cookie_consent";

export const COOKIE_CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

export interface CookieConsent {
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}

export type CookieConsentInput = Omit<CookieConsent, "necessary"> & {
  necessary?: boolean;
};

export function acceptAllConsent(): CookieConsent {
  return {
    necessary: true,
    preferences: true,
    analytics: true,
    marketing: true,
  };
}

export function rejectOptionalConsent(): CookieConsent {
  return {
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
  };
}

export function normalizeConsent(value: unknown): CookieConsent | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;

  if (
    typeof record.preferences !== "boolean" ||
    typeof record.analytics !== "boolean" ||
    typeof record.marketing !== "boolean"
  ) {
    return null;
  }

  return {
    necessary: true,
    preferences: record.preferences,
    analytics: record.analytics,
    marketing: record.marketing,
  };
}

export function serializeConsent(consent: CookieConsent): string {
  return encodeURIComponent(JSON.stringify(consent));
}

export function parseConsentCookie(raw: string | undefined | null): CookieConsent | null {
  if (!raw) return null;

  try {
    return normalizeConsent(JSON.parse(decodeURIComponent(raw)));
  } catch {
    return null;
  }
}

export function getConsentFromDocument(): CookieConsent | null {
  if (typeof document === "undefined") return null;

  const prefix = `${COOKIE_CONSENT_NAME}=`;
  const match = document.cookie.split("; ").find((row) => row.startsWith(prefix));

  if (!match) return null;

  return parseConsentCookie(match.slice(prefix.length));
}

export function setConsentCookie(consent: CookieConsent): void {
  if (typeof document === "undefined") return;

  const value = serializeConsent(consent);
  document.cookie = `${COOKIE_CONSENT_NAME}=${value}; path=/; max-age=${COOKIE_CONSENT_MAX_AGE}; SameSite=Lax`;
}

export function hasAnalyticsConsent(): boolean {
  return getConsentFromDocument()?.analytics === true;
}

export function hasPreferencesConsent(): boolean {
  return getConsentFromDocument()?.preferences === true;
}

export function hasMarketingConsent(): boolean {
  return getConsentFromDocument()?.marketing === true;
}
