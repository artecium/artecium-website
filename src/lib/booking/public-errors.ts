/** Map Supabase/Postgres errors to safe public messages (no internal details). */

const GENERIC = "booking.public.errors.generic";
const NOT_FOUND = "booking.public.errors.notFound";
const SLOT_UNAVAILABLE = "booking.public.errors.slotUnavailable";
const VALIDATION = "booking.public.errors.validation";
const IDEMPOTENCY = "booking.public.errors.idempotency";

export function publicBookingErrorKey(error: { message?: string; code?: string } | null): string {
  if (!error?.message) return GENERIC;

  const msg = error.message.toLowerCase();
  const code = error.code ?? "";

  if (code === "P0002" || msg.includes("business not found")) return NOT_FOUND;
  if (code === "23505" || msg.includes("slot no longer available")) return SLOT_UNAVAILABLE;
  if (msg.includes("idempotency")) return IDEMPOTENCY;
  if (
    code === "22023" ||
    msg.includes("required") ||
    msg.includes("invalid") ||
    msg.includes("outside") ||
    msg.includes("working hours") ||
    msg.includes("break") ||
    msg.includes("unavailable")
  ) {
    return VALIDATION;
  }

  return GENERIC;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
