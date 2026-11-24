/** Map server-action failures (including unexpected throws) to user-visible errors. */
export function bookingActionErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    if (message.includes("NEXT_REDIRECT")) {
      return "Session expired. Sign in again and retry.";
    }
    if (message) return message;
  }
  return "Save failed. Please try again.";
}