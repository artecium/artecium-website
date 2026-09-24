"use client";

import { replyToTicket, updateTicketStatus } from "@/lib/actions/admin/mutations";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TicketReplyFormProps {
  ticketId: string;
  currentStatus: string;
}

const STATUSES = ["new", "in_review", "in_progress", "awaiting_client", "resolved", "closed"];

export function TicketReplyForm({ ticketId, currentStatus }: TicketReplyFormProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [status, setStatus] = useState(currentStatus);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (body.trim()) {
        await replyToTicket(ticketId, body);
        setBody("");
      }
      if (status !== currentStatus) {
        await updateTicketStatus(ticketId, status);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update ticket.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
      <h3 className="text-base font-medium text-white">Respond to ticket</h3>
      <div>
        <label className="text-xs uppercase tracking-wide text-[#64748B]">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-1 w-full rounded-xl border border-[#1E293B] bg-[#050816] px-3 py-2 text-sm text-white"
        >
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {value.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs uppercase tracking-wide text-[#64748B]">Message</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-xl border border-[#1E293B] bg-[#050816] px-3 py-2 text-sm text-white"
          placeholder="Write a reply to the client..."
        />
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50"
      >
        {pending ? "Saving..." : "Send reply"}
      </button>
    </form>
  );
}
