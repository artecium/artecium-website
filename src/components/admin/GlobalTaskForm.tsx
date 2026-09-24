"use client";

import { TaskForm } from "@/components/admin/TaskForm";
import { adminInputClass, adminLabelClass } from "@/components/admin/AdminFormFields";
import { useState } from "react";

interface GlobalTaskFormProps {
  projects: Array<{ id: string; name: string }>;
  assignees: Array<{ id: string; label: string }>;
}

export function GlobalTaskForm({ projects, assignees }: GlobalTaskFormProps) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");

  if (!projectId) {
    return <p className="text-sm text-[#94A3B8]">No projects available to attach tasks.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={adminLabelClass}>Project</label>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={adminInputClass}>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <TaskForm key={projectId} projectId={projectId} assignees={assignees} />
    </div>
  );
}
