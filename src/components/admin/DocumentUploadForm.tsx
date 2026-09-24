"use client";

import {
  AdminFormError,
  AdminSubmitButton,
  adminInputClass,
  adminLabelClass,
} from "@/components/admin/AdminFormFields";
import {
  deleteDocument,
  getDocumentDownloadUrl,
  updateDocumentVisibility,
  uploadDocument,
} from "@/lib/actions/admin/documents";
import { DOCUMENT_VISIBILITY } from "@/types/platform";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DocumentUploadFormProps {
  companies: Array<{ id: string; name: string }>;
  projects?: Array<{ id: string; name: string }>;
  defaultCompanyId?: string;
}

export function DocumentUploadForm({
  companies,
  projects = [],
  defaultCompanyId,
}: DocumentUploadFormProps) {
  const router = useRouter();
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? "");
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [visibility, setVisibility] = useState("client_visible");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Please select a file.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("companyId", companyId);
      if (projectId) formData.set("projectId", projectId);
      formData.set("title", title);
      formData.set("category", category);
      formData.set("visibility", visibility);
      formData.set("file", file);
      await uploadDocument(formData);
      setTitle("");
      setFile(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={adminLabelClass}>Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} className={adminInputClass} />
        </div>
        <div>
          <label className={adminLabelClass}>Visibility</label>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className={adminInputClass}>
            {DOCUMENT_VISIBILITY.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={adminLabelClass}>File</label>
        <input
          required
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm text-[#94A3B8]"
        />
      </div>
      <AdminFormError message={error} />
      <AdminSubmitButton pending={pending} label="Upload document" pendingLabel="Uploading..." />
    </form>
  );
}

export function DocumentActions({
  documentId,
  visibility,
}: {
  documentId: string;
  visibility: string;
}) {
  const router = useRouter();
  const [currentVisibility, setCurrentVisibility] = useState(visibility);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setPending(true);
    setError(null);
    try {
      const url = await getDocumentDownloadUrl(documentId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setPending(false);
    }
  }

  async function saveVisibility() {
    setPending(true);
    setError(null);
    try {
      await updateDocumentVisibility(documentId, currentVisibility);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this document?")) return;
    setPending(true);
    try {
      await deleteDocument(documentId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={pending} onClick={download} className="text-sm text-[#93C5FD]">
        Download
      </button>
      <select
        value={currentVisibility}
        onChange={(e) => setCurrentVisibility(e.target.value)}
        className="rounded-lg border border-[#1E293B] bg-[#050816] px-2 py-1 text-xs text-white"
      >
        {DOCUMENT_VISIBILITY.map((value) => (
          <option key={value} value={value}>{value}</option>
        ))}
      </select>
      <button type="button" disabled={pending} onClick={saveVisibility} className="text-sm text-[#93C5FD]">
        Save visibility
      </button>
      <button type="button" disabled={pending} onClick={remove} className="text-sm text-red-300">
        Delete
      </button>
      {error ? <span className="text-xs text-red-300">{error}</span> : null}
    </div>
  );
}
