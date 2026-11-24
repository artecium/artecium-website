"use client";

import { setActiveBookingBusiness } from "@/lib/actions/booking/context";
import type { BookingMembership } from "@/lib/auth/booking-session";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface BookingBusinessSwitcherProps {
  memberships: BookingMembership[];
  activeBusinessId: string | null;
}

export function BookingBusinessSwitcher({
  memberships,
  activeBusinessId,
}: BookingBusinessSwitcherProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (memberships.length <= 1) return null;

  return (
    <label className="flex items-center gap-2 text-sm text-[#94A3B8]">
      <span className="sr-only">Business</span>
      <select
        disabled={pending}
        className="rounded-lg border border-[#1E293B] bg-[#0E1324] px-3 py-1.5 text-white"
        value={activeBusinessId ?? ""}
        onChange={(e) => {
          const id = e.target.value;
          startTransition(async () => {
            await setActiveBookingBusiness(id);
            router.refresh();
          });
        }}
      >
        {memberships.map((m) => (
          <option key={m.business_id} value={m.business_id}>
            {m.name}
          </option>
        ))}
      </select>
    </label>
  );
}
