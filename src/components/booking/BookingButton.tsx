"use client";

import type {
  BookingButtonFeedbackKind,
  BookingButtonState,
} from "@/lib/booking/use-booking-button-feedback";
import { useTranslations } from "next-intl";
import {
  bookingButtonBaseClass,
  bookingButtonVariantClass,
  type BookingButtonVariant,
} from "@/components/booking/booking-button-styles";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type { BookingButtonVariant };

function Spinner() {
  return (
    <svg
      className="h-4 w-4 motion-safe:animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
      />
    </svg>
  );
}

function CheckMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface BookingButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: BookingButtonVariant;
  feedbackKind: BookingButtonFeedbackKind;
  state: BookingButtonState;
  children: ReactNode;
  fullWidth?: boolean;
}

export function BookingButton({
  variant = "primary",
  feedbackKind,
  state,
  children,
  className = "",
  disabled,
  fullWidth,
  type = "button",
  ...rest
}: BookingButtonProps) {
  const tButtons = useTranslations("booking.buttons");
  const tCommon = useTranslations("common");

  const isBusy = state === "loading" || state === "success";
  const label =
    state === "loading"
      ? tCommon("loading")
      : state === "success"
        ? tButtons(`feedback.${feedbackKind}`)
        : children;

  return (
    <button
      type={type}
      disabled={disabled || isBusy}
      aria-busy={state === "loading" ? true : undefined}
      aria-live={state === "success" ? "polite" : undefined}
      data-booking-button-state={state}
      className={[
        bookingButtonBaseClass,
        bookingButtonVariantClass[variant],
        "disabled:cursor-not-allowed disabled:opacity-50",
        state === "success" ? "motion-safe:animate-booking-button-success" : "",
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {state === "loading" ? <Spinner /> : null}
      {state === "success" ? (
        <CheckMark className="motion-safe:animate-booking-check-pop text-emerald-300" />
      ) : null}
      <span className="truncate">{label}</span>
    </button>
  );
}