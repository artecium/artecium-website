"use client";

import { useTranslations } from "next-intl";

const SLOT_ROWS = [
  { time: "09:00", booked: true },
  { time: "10:30", booked: false },
  { time: "14:00", booked: true },
  { time: "16:30", booked: false },
] as const;

export function BookingDashboardPreview() {
  const t = useTranslations("home.booking.preview");

  return (
    <div
      className="pointer-events-none flex h-full select-none flex-col bg-[#050816] text-white"
      aria-hidden="true"
    >
      <header className="flex items-center justify-between border-b border-[#1E293B] px-4 py-3">
        <MotionlessTitle title={t("calendarTitle")} />
        <span className="rounded-md border border-[#1E293B] bg-[#0E1324] px-2 py-1 text-[10px] text-[#94A3B8]">
          {t("todayLabel")}
        </span>
      </header>

      <div className="grid flex-1 grid-cols-[72px_1fr] gap-0 min-[420px]:grid-cols-[88px_1fr]">
        <h4 className="sr-only">{t("timeColumn")}</h4>
        <div className="border-r border-[#1E293B] p-2">
          {SLOT_ROWS.map((row) => (
            <MotionlessTimeSlot key={row.time} time={row.time} />
          ))}
        </div>
        <div className="p-2">
          {SLOT_ROWS.map((row) => (
            <MotionlessBookingRow
              key={row.time}
              isBooked={row.booked}
              label={row.booked ? t("booked") : t("available")}
            />
          ))}
        </div>
      </div>

      <footer className="grid grid-cols-3 gap-2 border-t border-[#1E293B] bg-[#0E1324]/60 p-3">
        <MotionlessStat label={t("statAppointments")} value="12" />
        <MotionlessStat label={t("statServices")} value="8" />
        <MotionlessStat label={t("statStaff")} value="3" />
      </footer>
    </div>
  );
}

function MotionlessTitle({ title }: { title: string }) {
  return <p className="text-xs font-semibold text-white">{title}</p>;
}

function MotionlessTimeSlot({ time }: { time: string }) {
  return (
    <p className="mb-3 text-[10px] font-medium text-[#64748B] last:mb-0">{time}</p>
  );
}

function MotionlessBookingRow({
  isBooked,
  label,
}: {
  isBooked: boolean;
  label: string;
}) {
  return (
    <div
      className={`mb-3 flex min-h-[28px] items-center rounded-md border px-2 text-[10px] last:mb-0 ${
        isBooked
          ? "border-[#2563EB]/40 bg-[#2563EB]/15 text-[#CBD5E1]"
          : "border-[#1E293B] bg-[#0E1324]/40 text-[#64748B]"
      }`}
    >
      {label}
    </div>
  );
}

function MotionlessStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#1E293B] bg-[#050816] px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-wide text-[#64748B]">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export function BookingDashboardBrowserFrame() {
  const t = useTranslations("home.booking.preview");

  return (
    <div
      role="img"
      aria-label={t("overview")}
      className="flex h-full flex-col overflow-hidden rounded-xl bg-[#050816]"
    >
      <div className="flex items-center gap-2 border-b border-[#1E293B] bg-[#0E1324]/80 px-3 py-2.5 sm:px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]/70" />
        <div className="mx-auto flex h-6 w-full max-w-xs items-center rounded-md border border-[#1E293B] bg-[#050816] px-3 text-[10px] text-[#64748B] sm:max-w-sm sm:text-xs">
          booking.artecium.com/admin
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <BookingDashboardPreview />
      </div>
    </div>
  );
}