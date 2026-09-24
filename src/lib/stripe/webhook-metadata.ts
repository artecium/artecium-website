const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ArteciumCheckoutMetadata {
  companyId: string;
  invoiceId: string;
}

export function parseArteciumCheckoutMetadata(
  metadata: Record<string, string> | null | undefined,
): ArteciumCheckoutMetadata | null {
  const companyId = metadata?.company_id?.trim();
  const invoiceId = metadata?.invoice_id?.trim();

  if (!companyId || !invoiceId) return null;
  if (!UUID_RE.test(companyId) || !UUID_RE.test(invoiceId)) return null;

  return { companyId, invoiceId };
}
