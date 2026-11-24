import { createClient } from "@/lib/supabase/server";

/** booking_staff.id rows linked to the signed-in user within a business. */
export async function listOwnBookingStaffIds(
  businessId: string,
  userId: string,
): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("booking_staff")
    .select("id")
    .eq("business_id", businessId)
    .eq("profile_id", userId);

  if (error) return [];
  return (data ?? []).map((row) => row.id as string);
}
