"use server";

import { createClient } from "@/lib/supabase/server";

/** User may only link a booking business to a portal company they belong to. */
export async function assertUserCanLinkCompany(
  userId: string,
  companyId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", userId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: "Could not verify company access." };
  }
  if (!data) {
    return {
      ok: false,
      error: "You can only link companies where you are a portal member.",
    };
  }
  return { ok: true };
}
