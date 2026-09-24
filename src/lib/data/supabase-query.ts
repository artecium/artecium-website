import type { PostgrestError } from "@supabase/supabase-js";

export interface DataFetchResult<T> {
  data: T;
  error: string | null;
  accessDenied: boolean;
  /** Query was not run (e.g. missing company scope). */
  skipped: boolean;
}

export function isPermissionDenied(error: PostgrestError | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === "42501" ||
    (error.message ?? "").toLowerCase().includes("permission denied")
  );
}

export function logDataQueryError(context: string, error: PostgrestError | null): void {
  if (process.env.NODE_ENV !== "development" || !error) return;

  const level = isPermissionDenied(error) ? "warn" : "error";
  const message = `[data:${context}] ${error.message}${error.code ? ` (${error.code})` : ""}`;

  if (level === "warn") {
    console.warn(message);
  } else {
    console.error(message);
  }
}

export function emptyFetchResult<T>(data: T, options?: Partial<DataFetchResult<T>>): DataFetchResult<T> {
  return {
    data,
    error: null,
    accessDenied: false,
    skipped: false,
    ...options,
  };
}

export function fromQueryResult<T>(
  context: string,
  data: T | null,
  error: PostgrestError | null,
  emptyValue: T,
): DataFetchResult<T> {
  if (error) {
    logDataQueryError(context, error);
    return {
      data: emptyValue,
      error: error.message,
      accessDenied: isPermissionDenied(error),
      skipped: false,
    };
  }

  return emptyFetchResult(data ?? emptyValue);
}

export function skippedFetchResult<T>(data: T, reason?: string): DataFetchResult<T> {
  if (process.env.NODE_ENV === "development" && reason) {
    console.warn(`[data] skipped query: ${reason}`);
  }

  return {
    data,
    error: null,
    accessDenied: false,
    skipped: true,
  };
}
