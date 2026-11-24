import { createClient } from "@/lib/supabase/server";

export interface MemberStaffBusyInterval {
  staff_id: string;
  blocked_starts_at: string;
  blocked_ends_at: string;
}

export interface MemberStaffTimeOffInterval {
  staff_id: string;
  starts_at: string;
  ends_at: string;
}

export async function listMemberStaffBusyIntervals(
  businessId: string,
  rangeStart: string,
  rangeEnd: string,
  staffIds?: string[] | null,
): Promise<MemberStaffBusyInterval[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("booking_list_member_staff_busy_intervals", {
    p_business_id: businessId,
    p_range_start: rangeStart,
    p_range_end: rangeEnd,
    p_staff_ids: staffIds ?? null,
  });

  if (error) return [];
  return (data ?? []) as MemberStaffBusyInterval[];
}

export async function listMemberStaffTimeOffIntervals(
  businessId: string,
  rangeStart: string,
  rangeEnd: string,
  staffIds?: string[] | null,
): Promise<MemberStaffTimeOffInterval[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("booking_list_member_staff_time_off_intervals", {
    p_business_id: businessId,
    p_range_start: rangeStart,
    p_range_end: rangeEnd,
    p_staff_ids: staffIds ?? null,
  });

  if (error) return [];
  return (data ?? []) as MemberStaffTimeOffInterval[];
}

const MAX_RPC_WINDOW_MS = 31 * 86400000;

/** Chunks requests to respect the 31-day RPC window. */
export async function listMemberStaffBusyIntervalsForRange(
  businessId: string,
  rangeStart: string,
  rangeEnd: string,
  staffIds?: string[] | null,
): Promise<MemberStaffBusyInterval[]> {
  const startMs = new Date(rangeStart).getTime();
  const endMs = new Date(rangeEnd).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs >= endMs) {
    return [];
  }

  const merged: MemberStaffBusyInterval[] = [];
  let cursor = startMs;
  while (cursor < endMs) {
    const chunkEndMs = Math.min(endMs, cursor + MAX_RPC_WINDOW_MS);
    const chunk = await listMemberStaffBusyIntervals(
      businessId,
      new Date(cursor).toISOString(),
      new Date(chunkEndMs).toISOString(),
      staffIds,
    );
    merged.push(...chunk);
    cursor = chunkEndMs;
  }
  return merged;
}
