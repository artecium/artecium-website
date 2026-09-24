"use client";

import {
  AdminFormError,
  AdminSubmitButton,
  adminInputClass,
  adminLabelClass,
} from "@/components/admin/AdminFormFields";
import { createMilestone, deleteMilestone, updateMilestone } from "@/lib/actions/admin/milestones";
import { MILESTONE_STATUSES } from "@/types/platform";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface MilestoneFormProps {
  projectId: string;
  milestone?: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    due_date?: string | null;
    sort_order?: number;
  };
}

export function MilestoneForm({ projectId, milestone }: MilestoneFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(milestone?.title ?? "");
  const [description, setDescription] = useState(milestone?.description ?? "");
  const [status, setStatus] = useState(milestone?.status ?? "pending");
  const [dueDate, setDueDate] = useState(milestone?.due_date ?? "");
  const [sortOrder, setSortOrder] = useState(String(milestone?.sort_order ?? 0));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (milestone) {
        await updateMilestone(milestone.id, {
          title,
          description,
          status,
          dueDate: dueDate || null,
          sortOrder: Number(sortOrder),
        });
      } else {
        await createMilestone({
          projectId,
          title,
          description,
          status,
          dueDate: dueDate || null,
          sortOrder: Number(sortOrder),
        });
        setTitle("");
        setDescription("");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save milestone.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!milestone || !confirm("Delete this milestone?")) return;
    await deleteMilestone(milestone.id);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-[#1E293B] bg-[#050816]/40 p-4">
      <div>
        <label className={adminLabelClass}>Title</label>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className={adminInputClass} />
      </div>
      <div>
        <label className={adminLabelClass}>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={adminInputClass} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={adminLabelClass}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={adminInputClass}>
            {MILESTONE_STATUSES.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={adminLabelClass}>Due date</label>
          <input type="date" value={dueDate ?? ""} onChange={(e) => setDueDate(e.target.value)} className={adminInputClass} />
        </div>
        <div>
          <label className={adminLabelClass}>Sort order</label>
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={adminInputClass} />
        </div>
      </div>
      <AdminFormError message={error} />
      <div className="flex gap-2">
        <AdminSubmitButton pending={pending} label={milestone ? "Update" : "Create milestone"} />
        {milestone ? (
          <button type="button" onClick={handleDelete} className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-300">
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
