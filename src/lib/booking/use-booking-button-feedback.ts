"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type BookingButtonState = "idle" | "loading" | "success";

export type BookingButtonFeedbackKind =
  | "save"
  | "create"
  | "add"
  | "update"
  | "delete"
  | "confirm"
  | "approve"
  | "cancel"
  | "reschedule"
  | "submit"
  | "associate"
  | "invite";

export const BOOKING_BUTTON_SUCCESS_MS = 1500;

export function useBookingButtonFeedback() {
  const [state, setState] = useState<BookingButtonState>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const reset = useCallback(() => setState("idle"), []);
  const startLoading = useCallback(() => setState("loading"), []);
  const showSuccess = useCallback(() => {
    setState("success");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setState("idle"), BOOKING_BUTTON_SUCCESS_MS);
  }, []);

  return { state, reset, startLoading, showSuccess };
}

export type BookingActionResultLike = { ok: boolean; error?: string };

export async function runBookingAction(
  feedback: Pick<
    ReturnType<typeof useBookingButtonFeedback>,
    "state" | "startLoading" | "showSuccess" | "reset"
  >,
  fn: () => Promise<BookingActionResultLike>,
): Promise<BookingActionResultLike> {
  if (feedback.state === "loading" || feedback.state === "success") {
    return { ok: false, error: "Action in progress." };
  }
  feedback.startLoading();
  try {
    const result = await fn();
    if (!result.ok) {
      feedback.reset();
      return result;
    }
    feedback.showSuccess();
    return result;
  } catch (error) {
    feedback.reset();
    throw error;
  }
}

/** Multiple action buttons on one screen (per-row save, schedule days, etc.). */
export function useBookingButtonFeedbackRegistry() {
  const [states, setStates] = useState<Record<string, BookingButtonState>>({});
  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      for (const id of Object.keys(timeouts)) {
        clearTimeout(timeouts[id]);
      }
    };
  }, []);

  const getState = useCallback(
    (key: string): BookingButtonState => states[key] ?? "idle",
    [states],
  );

  const run = useCallback(
    async (
      key: string,
      fn: () => Promise<BookingActionResultLike>,
    ): Promise<BookingActionResultLike> => {
      let busy = false;
      setStates((prev) => {
        if (prev[key] === "loading" || prev[key] === "success") {
          busy = true;
          return prev;
        }
        return { ...prev, [key]: "loading" };
      });
      if (busy) return { ok: false, error: "Action in progress." };
      try {
        const result = await fn();
        if (!result.ok) {
          setStates((prev) => ({ ...prev, [key]: "idle" }));
          return result;
        }
        setStates((prev) => ({ ...prev, [key]: "success" }));
        const existing = timeoutsRef.current[key];
        if (existing) clearTimeout(existing);
        timeoutsRef.current[key] = setTimeout(() => {
          setStates((prev) => ({ ...prev, [key]: "idle" }));
        }, BOOKING_BUTTON_SUCCESS_MS);
        return result;
      } catch (error) {
        setStates((prev) => ({ ...prev, [key]: "idle" }));
        throw error;
      }
    },
    [],
  );

  return { getState, run };
}