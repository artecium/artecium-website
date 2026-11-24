"use client";

import { useState } from "react";

interface CompanyOption {
  id: string;
  name: string;
}

interface GoogleIntegrationConnectPanelProps {
  kind: "analytics" | "seo";
  companies: CompanyOption[];
}

export function GoogleIntegrationConnectPanel({
  kind,
  companies,
}: GoogleIntegrationConnectPanelProps) {
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");

  const label = kind === "analytics" ? "Google Analytics 4" : "Google Search Console";
  const startPath = `/api/integrations/google/start/${kind}?companyId=${encodeURIComponent(companyId)}`;

  return (
    <section className="mb-8 rounded-2xl border border-[#1E293B] bg-[#0E1324] p-5">
      <h2 className="text-lg font-medium text-white">Connect {label}</h2>
      <p className="mt-1 text-sm text-[#94A3B8]">
        Start OAuth for a pilot client. You must be signed in as staff with permission to manage this integration.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm text-[#94A3B8]">
          Client company
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <a
          href={companyId ? startPath : "#"}
          className={`inline-flex justify-center rounded-full px-4 py-2 text-sm font-medium text-white ${
            companyId ? "bg-[#2563EB] hover:bg-[#1D4ED8]" : "cursor-not-allowed bg-[#334155]"
          }`}
          aria-disabled={!companyId}
        >
          Connect {label}
        </a>
      </div>
    </section>
  );
}
