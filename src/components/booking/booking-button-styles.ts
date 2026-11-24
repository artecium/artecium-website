export type BookingButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export const bookingButtonVariantClass: Record<BookingButtonVariant, string> = {
  primary:
    "border border-violet-500/30 bg-violet-600 text-white shadow-sm shadow-violet-950/30 hover:bg-violet-500 active:bg-violet-700",
  secondary:
    "border border-[#334155] bg-[#0E1324] text-white hover:bg-[#141a2e] active:bg-[#1a2238]",
  danger:
    "border border-red-500/45 bg-red-500/10 text-red-100 hover:bg-red-500/20 active:bg-red-500/25",
  ghost:
    "border border-transparent bg-transparent text-[#94A3B8] hover:bg-[#0E1324] hover:text-white active:bg-[#141a2e]",
};

export const bookingButtonBaseClass =
  "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-[background-color,border-color,color,opacity,transform] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400";

export function bookingButtonSurfaceClass(
  variant: BookingButtonVariant = "secondary",
  className = "",
): string {
  return [bookingButtonBaseClass, bookingButtonVariantClass[variant], className]
    .filter(Boolean)
    .join(" ");
}