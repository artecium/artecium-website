import {
  type DataFetchResult,
  fromQueryResult,
  skippedFetchResult,
} from "@/lib/data/supabase-query";
import { createClient } from "@/lib/supabase/server";

export interface ClientInvoiceItemRow {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface ClientInvoiceRow {
  id: string;
  invoice_number: string | null;
  status: string;
  issue_date: string | null;
  due_date: string | null;
  total: number | null;
  amount_paid: number;
  currency: string;
  created_at: string;
  items: ClientInvoiceItemRow[];
}

function mapInvoiceRow(
  row: Record<string, unknown>,
  items: ClientInvoiceItemRow[] = [],
): ClientInvoiceRow {
  return {
    id: row.id as string,
    invoice_number: (row.invoice_number as string | null) ?? null,
    status: row.status as string,
    issue_date: (row.issue_date as string | null) ?? null,
    due_date: (row.due_date as string | null) ?? null,
    total: row.total !== null && row.total !== undefined ? Number(row.total) : null,
    amount_paid: Number(row.amount_paid ?? 0),
    currency: (row.currency as string) ?? "EUR",
    created_at: row.created_at as string,
    items,
  };
}

export function getInvoiceAmountDue(invoice: ClientInvoiceRow): number | null {
  if (invoice.total === null) return null;
  const due = invoice.total - invoice.amount_paid;
  return due > 0 ? due : null;
}

export async function getClientInvoices(
  companyIds: string[],
): Promise<DataFetchResult<ClientInvoiceRow[]>> {
  if (!companyIds.length) {
    return skippedFetchResult([], "getClientInvoices requires companyIds");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, status, issue_date, due_date, total, amount_paid, currency, created_at",
    )
    .in("company_id", companyIds)
    .order("issue_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    return fromQueryResult("client-invoices.getClientInvoices", null, error, []);
  }

  const invoiceIds = (data ?? []).map((row) => row.id as string);
  const itemsByInvoice = new Map<string, ClientInvoiceItemRow[]>();

  if (invoiceIds.length) {
    const { data: items, error: itemsError } = await supabase
      .from("invoice_items")
      .select("id, invoice_id, description, quantity, unit_price")
      .in("invoice_id", invoiceIds);

    if (itemsError) {
      return fromQueryResult("client-invoices.getClientInvoices.items", null, itemsError, []);
    }

    for (const item of items ?? []) {
      const invoiceId = item.invoice_id as string;
      const list = itemsByInvoice.get(invoiceId) ?? [];
      list.push({
        id: item.id as string,
        description: item.description as string,
        quantity: Number(item.quantity ?? 0),
        unit_price: Number(item.unit_price ?? 0),
      });
      itemsByInvoice.set(invoiceId, list);
    }
  }

  const invoices = (data ?? []).map((row) =>
    mapInvoiceRow(
      row as Record<string, unknown>,
      itemsByInvoice.get(row.id as string) ?? [],
    ),
  );

  return fromQueryResult("client-invoices.getClientInvoices", invoices, null, []);
}
