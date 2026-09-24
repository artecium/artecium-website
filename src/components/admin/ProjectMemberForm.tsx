"use client";

import {
  AdminFormError,
  AdminSubmitButton,
  adminInputClass,
  adminLabelClass,
} from "@/components/admin/AdminFormFields";
import {
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
} from "@/lib/actions/admin/project-members";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProjectMemberFormProps {
  projectId: string;
  candidates: Array<{ id: string; label: string }>;
}

export function ProjectMemberForm({ projectId, candidates }: ProjectMemberFormProps) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("developer");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!userId) return;
    setPending(true);
    setError(null);
    try {
      await addProjectMember({ projectId, userId, role });
      setUserId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-[#1E293B] bg-[#050816]/40 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={adminLabelClass}>User</label>
          <select required value={userId} onChange={(e) => setUserId(e.target.value)} className={adminInputClass}>
            <option value="">Select user</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={adminLabelClass}>Role</label>
          <input value={role} onChange={(e) => setRole(e.target.value)} className={adminInputClass} />
        </div>
      </div>
      <AdminFormError message={error} />
      <AdminSubmitButton pending={pending} label="Add member" />
    </form>
  );
}

export function ProjectMemberRow({
  projectId,
  userId,
  name,
  email,
  role,
}: {
  projectId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
}) {
  const router = useRouter();
  const [memberRole, setMemberRole] = useState(role);
  const [pending, setPending] = useState(false);

  async function saveRole() {
    setPending(true);
    try {
      await updateProjectMemberRole({ projectId, userId, role: memberRole });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!confirm("Remove this member?")) return;
    setPending(true);
    try {
      await removeProjectMember(projectId, userId);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#1E293B] bg-[#050816]/40 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{name}</p>
        <p className="text-xs text-[#94A3B8]">{email}</p>
      </div>
      <input value={memberRole} onChange={(e) => setMemberRole(e.target.value)} className="w-32 rounded-lg border border-[#1E293B] bg-[#050816] px-2 py-1 text-sm text-white" />
      <button type="button" disabled={pending} onClick={saveRole} className="text-sm text-[#93C5FD]">Save</button>
      <button type="button" disabled={pending} onClick={remove} className="text-sm text-red-300">Remove</button>
    </div>
  );
}
