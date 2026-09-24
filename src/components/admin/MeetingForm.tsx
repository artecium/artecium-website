"use client";

import {
  AdminFormError,
  AdminSubmitButton,
  adminInputClass,
  adminLabelClass,
} from "@/components/admin/AdminFormFields";
import { cancelMeeting, createMeeting, updateMeeting } from "@/lib/actions/admin/meetings";
import { MEETING_STATUSES } from "@/types/platform";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface MeetingFormProps {
  companies: Array<{ id: string; name: string }>;
  projects?: Array<{ id: string; name: string }>;
  defaultCompanyId?: string;
  meeting?: {
    id: string;
    company_id: string | null;
    project_id: string | null;
    title: string;
    description?: string | null;
    starts_at: string;
    ends_at?: string | null;
    meeting_url?: string | null;
    status: string;
  };
}

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function MeetingForm({
  companies,
  projects = [],
  defaultCompanyId,
  meeting,
}: MeetingFormProps) {
  const router = useRouter();
  const [companyId, setCompanyId] = useState(meeting?.company_id ?? defaultCompanyId ?? "");
  const [projectId, setProjectId] = useState(meeting?.project_id ?? "");
  const [title, setTitle] = useState(meeting?.title ?? "");
  const [description, setDescription] = useState(meeting?.description ?? "");
  const [startsAt, setStartsAt] = useState(toLocalInput(meeting?.starts_at));
  const [endsAt, setEndsAt] = useState(toLocalInput(meeting?.ends_at));
  const [meetingUrl, setMeetingUrl] = useState(meeting?.meeting_url ?? "");
  const [status, setStatus] = useState(meeting?.status ?? "scheduled");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const payload = {
        companyId,
        projectId: projectId || null,
        title,
        description,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        meetingUrl,
        status,
      };
      if (meeting) {
        await updateMeeting(meeting.id, {
          title: payload.title,
          description: payload.description,
          startsAt: payload.startsAt,
          endsAt: payload.endsAt,
          meetingUrl: payload.meetingUrl,
          status: payload.status,
          projectId: payload.projectId,
        });
      } else {
        await createMeeting(payload);
        setTitle("");
        setDescription("");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save meeting.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
      {!meeting ? (
        <div>
          <label className={adminLabelClass}>Client</label>
          <select required value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={adminInputClass}>
            <option value="">Select client</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      ) : null}
      {projects.length ? (
        <div>
          <label className={adminLabelClass}>Project</label>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={adminInputClass}>
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      ) : null}
      <div>
        <label className={adminLabelClass}>Title</label>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className={adminInputClass} />
      </div>
      <div>
        <label className={adminLabelClass}>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={adminInputClass} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={adminLabelClass}>Starts</label>
          <input required type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={adminInputClass} />
        </div>
        <div>
          <label className={adminLabelClass}>Ends</label>
          <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={adminInputClass} />
        </div>
      </div>
      <div>
        <label className={adminLabelClass}>Meeting URL</label>
        <input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} className={adminInputClass} />
      </div>
      <div>
        <label className={adminLabelClass}>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={adminInputClass}>
          {MEETING_STATUSES.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </div>
      <AdminFormError message={error} />
      <div className="flex gap-2">
        <AdminSubmitButton pending={pending} label={meeting ? "Update meeting" : "Create meeting"} />
        {meeting && meeting.status !== "cancelled" ? (
          <button
            type="button"
            disabled={pending}
            onClick={async () => {
              await cancelMeeting(meeting.id);
              router.refresh();
            }}
            className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-300"
          >
            Cancel meeting
          </button>
        ) : null}
      </div>
    </form>
  );
}
