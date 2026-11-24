import type { BookingSession } from "@/lib/auth/booking-session";
import type { PlatformProfile } from "@/types/platform";

export function bookingSessionToPlatformProfile(session: BookingSession): PlatformProfile {
  return {
    id: session.userId,
    email: session.email,
    full_name: null,
    avatar_url: null,
    locale: "en",
    currency: "EUR",
    roles: [],
    permissions: [],
    company_ids: [],
  };
}
