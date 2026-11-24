"use client";

import { useMemo, useState } from "react";

export interface MetricsTableColumn<T> {
  key: keyof T | string;
  label: string;
  align?: "left" | "right";
  render?: (row: T) => string;
  /** Serializable sort hint (sort logic stays in this Client Component). */
  sortAs?: "number" | "string";
}

interface MetricsDataTableProps<T extends Record<string, unknown>> {
  title: string;
  rows: T[];
  columns: MetricsTableColumn<T>[];
  searchPlaceholder: string;
  emptyMessage: string;
  exportFilename?: string;
  exportLabel?: string;
}

function cellValue<T extends Record<string, unknown>>(
  row: T,
  col: MetricsTableColumn<T>,
): string {
  if (col.render) return col.render(row);
  const v = row[col.key as keyof T];
  return v === null || v === undefined ? "—" : String(v);
}

function sortComparable<T extends Record<string, unknown>>(
  row: T,
  col: MetricsTableColumn<T>,
): number | string {
  if (col.sortAs === "number") {
    const v = row[col.key as keyof T];
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
  }
  if (col.sortAs === "string") {
    return cellValue(row, col);
  }
  const v = row[col.key as keyof T];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return cellValue(row, col);
}

export function MetricsDataTable<T extends Record<string, unknown>>({
  title,
  rows,
  columns,
  searchPlaceholder,
  emptyMessage,
  exportFilename,
  exportLabel,
}: MetricsDataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let list = rows;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((row) =>
        columns.some((col) => cellValue(row, col).toLowerCase().includes(q)),
      );
    }
    if (sortKey) {
      const col = columns.find((c) => String(c.key) === sortKey);
      if (col) {
        list = [...list].sort((a, b) => {
          const av = sortComparable(a, col);
          const bv = sortComparable(b, col);
          if (av < bv) return sortDir === "asc" ? -1 : 1;
          if (av > bv) return sortDir === "asc" ? 1 : -1;
          return 0;
        });
      }
    }
    return list;
  }, [rows, query, sortKey, sortDir, columns]);

  const exportCsv = () => {
    if (!exportFilename || !filtered.length) return;
    const header = columns.map((c) => c.label).join(",");
    const body = filtered
      .map((row) =>
        columns
          .map((col) => `"${cellValue(row, col).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="min-w-[200px] flex-1 rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-sm text-white"
          />
          {exportFilename && exportLabel && rows.length ? (
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-lg border border-[#1E293B] px-3 py-2 text-sm text-[#94A3B8] hover:border-[#2563EB]/40 hover:text-white"
            >
              {exportLabel}
            </button>
          ) : null}
        </div>
      </div>
      {filtered.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#1E293B] text-xs uppercase tracking-wide text-[#64748B]">
                {columns.map((col) => (
                  <th key={String(col.key)} className="px-3 py-2">
                    <button
                      type="button"
                      className="hover:text-white"
                      onClick={() => {
                        const key = String(col.key);
                        if (sortKey === key) {
                          setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                        } else {
                          setSortKey(key);
                          setSortDir("desc");
                        }
                      }}
                    >
                      {col.label}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((row, i) => (
                <tr key={i} className="border-b border-[#1E293B]/60 text-[#E2E8F0]">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-3 py-2.5">
                      {cellValue(row, col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-[#94A3B8]">{emptyMessage}</p>
      )}
    </section>
  );
}
