/**
 * Dev-only logs for client-area navigation (no cookies, tokens, or secrets).
 */

type ClientRouteDiagnosticDetail = Record<
  string,
  string | boolean | number | null | undefined
>;

/** Dev beacons use warn so they appear in the terminal and in `.next/dev/logs/next-development.log`. */
export function logClientRouteBeacon(message: string): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.warn(`[ARTECIUM-DEV] ${message}`);
}

export function logClientRouteDiagnostic(
  phase: string,
  detail: ClientRouteDiagnosticDetail,
): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.warn(`[client-route:${phase}]`, JSON.stringify(detail));
}

export function isRscFlightRequest(rscHeader: string | null): boolean {
  const value = rscHeader?.trim();
  return value === "1" || value === "true";
}

/** Safe redirect target for logs: pathname + host only. */
export function redactRedirectTarget(url: URL): string {
  return `${url.protocol}//${url.host}${url.pathname}${url.search}`;
}
