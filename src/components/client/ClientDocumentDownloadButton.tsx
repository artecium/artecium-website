"use client";

import { getClientDocumentDownloadUrl } from "@/lib/actions/documents/download";
import { useState } from "react";

export function ClientDocumentDownloadButton({
  documentId,
  hasFile,
}: {
  documentId: string;
  hasFile: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hasFile) return null;

  async function handleDownload() {
    setPending(true);
    setError(null);
    try {
      const url = await getClientDocumentDownloadUrl(documentId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={pending}
        onClick={handleDownload}
        className="rounded-xl border border-[#2563EB]/40 px-3 py-1.5 text-sm text-[#93C5FD] hover:bg-[#2563EB]/10 disabled:opacity-50"
      >
        {pending ? "Preparing..." : "Download"}
      </button>
      {error ? <p className="mt-1 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
