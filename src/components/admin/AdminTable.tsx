import type { ReactNode } from "react";

export interface AdminTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
}

export function AdminTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "No records found.",
}: AdminTableProps<T>) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] px-6 py-12 text-center text-sm text-[#94A3B8]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#1E293B] bg-[#0E1324]">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[#1E293B] text-xs uppercase tracking-wide text-[#64748B]">
            {columns.map((col) => (
              <th key={col.key} className={`px-4 py-3 font-medium ${col.className ?? ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-[#1E293B]/60 transition-colors last:border-0 hover:bg-[#050816]/50"
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 text-[#E2E8F0] ${col.className ?? ""}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
