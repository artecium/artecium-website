"use client";

import { updateProjectProgress } from "@/lib/actions/admin/mutations";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProjectProgressFormProps {
  projectId: string;
  initialProgress: number;
}

export function ProjectProgressForm({ projectId, initialProgress }: ProjectProgressFormProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(initialProgress);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      await updateProjectProgress(projectId, progress);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="text-xs uppercase tracking-wide text-[#64748B]">Progress %</label>
        <input
          type="number"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="mt-1 block w-28 rounded-xl border border-[#1E293B] bg-[#050816] px-3 py-2 text-sm text-white"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Saving..." : "Update"}
      </button>
    </form>
  );
}
