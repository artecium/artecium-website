import {
  bookingButtonSurfaceClass,
  type BookingButtonVariant,
} from "@/components/booking/booking-button-styles";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export interface BookingActionLinkProps extends Omit<ComponentProps<typeof Link>, "className"> {
  variant?: BookingButtonVariant;
  className?: string;
  children: ReactNode;
}

/** Navigational CTAs that should match Booking button chrome (no loading/success states). */
export function BookingActionLink({
  variant = "secondary",
  className = "",
  children,
  ...rest
}: BookingActionLinkProps) {
  return (
    <Link className={bookingButtonSurfaceClass(variant, className)} {...rest}>
      {children}
    </Link>
  );
}