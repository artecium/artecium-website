"use client";

import {
  AdminFormError,
  AdminSubmitButton,
  adminInputClass,
  adminLabelClass,
} from "@/components/admin/AdminFormFields";
import { createReport, deleteReport, updateReport } from "@/lib/actions/admin/reports";
import { DOCUMENT_VISIBILITY } from "@/types/platform";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ReportFormProps {
  companies: Array<{ id: string; name: string }>;
  projects?: Array<{ id: string; name: string }>;
  defaultCompanyId?: string;
  report?: {
    id: string;
    company_id: string;
    project_id: string | null;
    title: string;
    report_type: string;
    visibility: string;
    period_start?: string | null;
    period_end?: string | null;
  };
}

export function ReportForm({
  companies,
  projects = [],
  defaultCompanyId,
  report,
}: ReportFormProps) {
  const router = useRouter();
  const [companyId, setCompanyId] = useState(report?.company_id ?? defaultCompanyId ?? "");
  const [projectId, setProjectId] = useState(report?.project_id ?? "");
  const [title, setTitle] = useState(report?.title ?? "");
  const [reportType, setReportType] = useState(report?.report_type ?? "monthly");
  const [visibility, setVisibility] = useState(report?.visibility ?? "client_visible");
  const [periodStart, setPeriodStart] = useState(report?.period_start ?? "");
  const [periodEnd, setPeriodEnd] = useState(report?.period_end ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (report) {
        await updateReport(report.id, {
          title,
          reportType,
          visibility,
          periodStart: periodStart || null,
          periodEnd: periodEnd || null,
          projectId: projectId || null,
        });
      } else {
        await createReport({
          companyId,
          projectId: projectId || null,
          title,
          reportType,
          visibility,
          periodStart: periodStart || null,
          periodEnd: periodEnd || null,
        });
        setTitle("");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save report.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
      {!report ? (
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={adminLabelClass}>Type</label>
          <input required value={reportType} onChange={(e) => setReportType(e.target.value)} className={adminInputClass} />
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={adminLabelClass}>Period start</label>
          <input type="date" value={periodStart ?? ""} onChange={(e) => setPeriodStart(e.target.value)} className={adminInputClass} />
        </div>
        <div>
          <label className={adminLabelClass}>Period end</label>
          <input type="date" value={periodEnd ?? ""} onChange={(e) => setPeriodEnd(e.target.value)} className={adminInputClass} />
        </div>
      </div>
      <AdminFormError message={error} />
      <div className="flex gap-2">
        <AdminSubmitButton pending={pending} label={report ? "Update report" : "Create report"} />
        {report ? (
          <button
            type="button"
            onClick={async () => {
              if (!confirm("Delete this report?")) return;
              await deleteReport(report.id);
              router.refresh();
            }}
            className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-300"
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
