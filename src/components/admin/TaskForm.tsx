"use client";

import {
  AdminFormError,
  AdminSubmitButton,
  adminInputClass,
  adminLabelClass,
} from "@/components/admin/AdminFormFields";
import { createTask, deleteTask, updateTask } from "@/lib/actions/admin/tasks";
import { PROJECT_PRIORITIES, TASK_STATUSES } from "@/types/platform";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TaskFormProps {
  projectId: string;
  task?: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    due_date?: string | null;
    assignee_id?: string | null;
  };
  assignees?: Array<{ id: string; label: string }>;
  onDone?: () => void;
}

export function TaskForm({ projectId, task, assignees = [], onDone }: TaskFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState(task?.status ?? "todo");
  const [priority, setPriority] = useState(task?.priority ?? "normal");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [assigneeId, setAssigneeId] = useState(task?.assignee_id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (task) {
        await updateTask(task.id, {
          title,
          description,
          status,
          priority,
          dueDate: dueDate || null,
          assigneeId: assigneeId || null,
        });
      } else {
        await createTask({
          projectId,
          title,
          description,
          status,
          priority,
          dueDate: dueDate || null,
          assigneeId: assigneeId || null,
        });
        setTitle("");
        setDescription("");
      }
      router.refresh();
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!task || !confirm("Delete this task?")) return;
    setPending(true);
    setError(null);
    try {
      await deleteTask(task.id);
      router.refresh();
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task.");
    } finally {
      setPending(false);
    }
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={adminLabelClass}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={adminInputClass}>
            {TASK_STATUSES.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={adminLabelClass}>Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={adminInputClass}>
            {PROJECT_PRIORITIES.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={adminLabelClass}>Due date</label>
          <input type="date" value={dueDate ?? ""} onChange={(e) => setDueDate(e.target.value)} className={adminInputClass} />
        </div>
        {assignees.length ? (
          <div>
            <label className={adminLabelClass}>Assignee</label>
            <select value={assigneeId ?? ""} onChange={(e) => setAssigneeId(e.target.value)} className={adminInputClass}>
              <option value="">Unassigned</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      <AdminFormError message={error} />
      <div className="flex gap-2">
        <AdminSubmitButton pending={pending} label={task ? "Update task" : "Create task"} />
        {task ? (
          <button type="button" onClick={handleDelete} disabled={pending} className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-300">
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
