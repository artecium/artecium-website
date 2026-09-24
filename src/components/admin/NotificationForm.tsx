"use client";

import {
  AdminFormError,
  AdminSubmitButton,
  adminInputClass,
  adminLabelClass,
} from "@/components/admin/AdminFormFields";
import { createNotification } from "@/lib/actions/admin/notifications";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface NotificationFormProps {
  companies: Array<{ id: string; name: string }>;
  recipients: Array<{ id: string; label: string; companyId: string }>;
  defaultCompanyId?: string;
}

export function NotificationForm({
  companies,
  recipients,
  defaultCompanyId,
}: NotificationFormProps) {
  const router = useRouter();
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? "");
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("general");
  const [category, setCategory] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredRecipients = recipients.filter((r) => !companyId || r.companyId === companyId);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await createNotification({
        companyId,
        userId,
        title,
        body,
        type,
        category: category || null,
      });
      setTitle("");
      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create notification.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
      <div>
        <label className={adminLabelClass}>Client</label>
        <select required value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={adminInputClass}>
          <option value="">Select client</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={adminLabelClass}>Recipient</label>
        <select required value={userId} onChange={(e) => setUserId(e.target.value)} className={adminInputClass}>
          <option value="">Select recipient</option>
          {filteredRecipients.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={adminLabelClass}>Title</label>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className={adminInputClass} />
      </div>
      <div>
        <label className={adminLabelClass}>Message</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className={adminInputClass} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={adminLabelClass}>Type</label>
          <input value={type} onChange={(e) => setType(e.target.value)} className={adminInputClass} />
        </div>
        <div>
          <label className={adminLabelClass}>Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} className={adminInputClass} />
        </div>
      </div>
      <AdminFormError message={error} />
      <AdminSubmitButton pending={pending} label="Send notification" />
    </form>
  );
}
