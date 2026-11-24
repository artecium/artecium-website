"use client";

import type { BookingAppointmentRow } from "@/lib/data/booking/appointments";
import type { MemberStaffBusyInterval } from "@/lib/data/booking/member-busy-intervals";
import Link from "next/link";

type ViewMode = "day" | "week" | "month";

interface BookingCalendarProps {
  appointments: BookingAppointmentRow[];
  colleagueBusy?: MemberStaffBusyInterval[];
  staffNames?: Map<string, string>;
  view: ViewMode;
  anchorDate: string;
  baseHref: string;
  labels: {
    day: string;
    week: string;
    month: string;
    noAppointments: string;
    colleagueBusy?: string;
  };
}

function serviceName(row: BookingAppointmentRow): string {
  const s = row.booking_services;
  const one = Array.isArray(s) ? s[0] : s;
  return one?.name ?? "—";
}

function staffName(row: BookingAppointmentRow): string {
  const s = row.booking_staff;
  const one = Array.isArray(s) ? s[0] : s;
  return one?.display_name ?? "—";
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function BookingCalendar({
  appointments,
  colleagueBusy = [],
  staffNames,
  view,
  anchorDate,
  baseHref,
  labels,
}: BookingCalendarProps) {
  const anchor = new Date(`${anchorDate}T12:00:00`);
  const viewLinks = (["day", "week", "month"] as const).map((v) => ({
    v,
    label: v === "day" ? labels.day : v === "week" ? labels.week : labels.month,
    href: `${baseHref}?view=${v}&date=${anchorDate}`,
  }));

  const byDay = new Map<string, BookingAppointmentRow[]>();
  for (const apt of appointments) {
    const key = apt.starts_at.slice(0, 10);
    const list = byDay.get(key) ?? [];
    list.push(apt);
    byDay.set(key, list);
  }

  const busyByDay = new Map<string, MemberStaffBusyInterval[]>();
  for (const block of colleagueBusy) {
    const key = block.blocked_starts_at.slice(0, 10);
    const list = busyByDay.get(key) ?? [];
    list.push(block);
    busyByDay.set(key, list);
  }

  let days: Date[] = [];
  if (view === "day") {
    days = [anchor];
  } else if (view === "week") {
    const start = startOfWeek(anchor);
    days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  } else {
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {viewLinks.map(({ v, label, href }) => (
          <Link
            key={v}
            href={href}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              view === v
                ? "bg-violet-600 text-white"
                : "border border-[#1E293B] text-[#94A3B8] hover:text-white"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div
        className={
          view === "month"
            ? "grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"
            : "grid gap-3"
        }
      >
        {days.map((day) => {
          const key = formatDayKey(day);
          const items = byDay.get(key) ?? [];
          const busyItems = busyByDay.get(key) ?? [];
          return (
            <div
              key={key}
              className="min-h-[6rem] rounded-xl border border-[#1E293B] bg-[#0E1324]/40 p-3"
            >
              <p className="text-xs font-medium text-[#64748B]">
                {day.toLocaleDateString(undefined, {
                  weekday: view === "month" ? "short" : "long",
                  day: "numeric",
                  month: view === "day" ? "long" : "short",
                })}
              </p>
              {items.length === 0 && busyItems.length === 0 ? (
                <p className="mt-2 text-xs text-[#475569]">{labels.noAppointments}</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {items.map((apt) => (
                    <li
                      key={apt.id}
                      className="rounded-lg border border-[#1E293B]/80 bg-[#050816] px-2 py-1.5 text-xs"
                    >
                      <p className="font-medium text-white">
                        {new Date(apt.starts_at).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {serviceName(apt)}
                      </p>
                      <p className="text-[#94A3B8]">
                        {staffName(apt)} · {apt.status}
                      </p>
                    </li>
                  ))}
                  {busyItems.map((block) => (
                    <li
                      key={`${block.staff_id}-${block.blocked_starts_at}`}
                      className="rounded-lg border border-dashed border-[#334155] bg-[#050816]/60 px-2 py-1.5 text-xs"
                    >
                      <p className="font-medium text-[#94A3B8]">
                        {new Date(block.blocked_starts_at).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {labels.colleagueBusy ?? "Busy"}
                      </p>
                      <p className="text-[#64748B]">
                        {staffNames?.get(block.staff_id) ?? "—"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
