import type { ReactNode } from "react";

export const adminInputClass =
  "mt-1 w-full rounded-xl border border-[#1E293B] bg-[#050816] px-3 py-2 text-sm text-white";
export const adminLabelClass = "text-xs uppercase tracking-wide text-[#64748B]";

export function AdminFormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
      <h3 className="mb-4 text-base font-medium text-white">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function AdminFormError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="text-sm text-red-300">{message}</p>;
}

export function AdminSubmitButton({
  pending,
  label,
  pendingLabel = "Saving...",
}: {
  pending: boolean;
  label: string;
  pendingLabel?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8] disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
