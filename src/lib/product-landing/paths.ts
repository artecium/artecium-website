import type { AppLocale } from "@/i18n/config";

export const BOOKING_MARKETING_DEMO_PATH = "/artecium-demo";
export const BOOKING_PUBLIC_ORIGIN = "https://booking.artecium.com";

export const CLIENT_LOGIN_NEXT = "/login?next=%2Fclient";

export function getClientAreaLandingPath(locale: AppLocale): string {
  return locale === "en" ? "/en/client-area" : "/area-cliente";
}

export function getBookingMarketingPath(locale: AppLocale): string {
  return locale === "en" ? "/en/booking" : "/booking";
}

export function getAlternateClientAreaLandingPath(locale: AppLocale): string {
  return locale === "en" ? "/area-cliente" : "/en/client-area";
}

export function getAlternateBookingMarketingPath(locale: AppLocale): string {
  return locale === "en" ? "/booking" : "/en/booking";
}