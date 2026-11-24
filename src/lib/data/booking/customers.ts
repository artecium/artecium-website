import { createClient } from "@/lib/supabase/server";

export interface BookingCustomerRow {
  id: string;
  business_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
}

export async function listBookingCustomers(
  businessId: string,
  options?: { includeInternalNotes: boolean },
): Promise<BookingCustomerRow[]> {
  const supabase = await createClient();
  const withNotes = options?.includeInternalNotes === true;

  const { data, error } = await supabase
    .from(withNotes ? "booking_customers" : "booking_customers_member")
    .select("id, business_id, full_name, email, phone, profile_id, created_at, updated_at")
    .eq("business_id", businessId)
    .order("full_name");

  if (error) return [];
  const rows = (data ?? []) as Omit<BookingCustomerRow, "notes">[];

  if (!withNotes || rows.length === 0) {
    return rows.map((row) => ({ ...row, notes: null }));
  }

  const { data: noteRows } = await supabase
    .from("booking_customer_internal_notes")
    .select("customer_id, notes")
    .eq("business_id", businessId)
    .in(
      "customer_id",
      rows.map((r) => r.id),
    );

  const notesByCustomer = new Map(
    (noteRows ?? []).map((n) => [n.customer_id as string, (n.notes as string | null) ?? null]),
  );

  return rows.map((row) => ({
    ...row,
    notes: notesByCustomer.get(row.id) ?? null,
  }));
}
