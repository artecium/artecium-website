import type { ReactNode } from "react";
import type { ProjectDiscoveryData } from "@/types/project";
import {
  BUDGET_LABELS,
  PROJECT_TYPE_LABELS,
  TIMELINE_LABELS,
} from "@/types/project";

interface BriefItem {
  icon: ReactNode;
  label: string;
  value: string;
}

function BriefRow({ icon, label, value, delay }: BriefItem & { delay: number }) {
  return (
    <div
      className="flex gap-4 border-b border-[#1E293B]/60 py-5 last:border-b-0"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#1E293B] bg-[#0E1324] text-[#2563EB]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium tracking-wide text-[#94A3B8] uppercase">
          {label}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-white sm:text-[0.9375rem]">
          {value}
        </p>
      </div>
    </div>
  );
}

const icons = {
  project: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
    </svg>
  ),
  budget: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  timeline: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  company: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  ),
  contact: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 19.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
  description: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
};

interface DiscoveryBriefProps {
  data: ProjectDiscoveryData;
}

export function DiscoveryBrief({ data }: DiscoveryBriefProps) {
  const items: BriefItem[] = [
    {
      icon: icons.project,
      label: "Project",
      value: data.projectType ? PROJECT_TYPE_LABELS[data.projectType] : "—",
    },
    {
      icon: icons.budget,
      label: "Estimated Budget",
      value: data.budget ? BUDGET_LABELS[data.budget] : "—",
    },
    {
      icon: icons.timeline,
      label: "Timeline",
      value: data.timeline ? TIMELINE_LABELS[data.timeline] : "—",
    },
  ];

  if (data.company.trim()) {
    items.push({
      icon: icons.company,
      label: "Company",
      value: data.company.trim(),
    });
  }

  items.push(
    {
      icon: icons.contact,
      label: "Contact",
      value: `${data.name} · ${data.email}`,
    },
    {
      icon: icons.description,
      label: "Project Description",
      value: data.description.trim(),
    },
  );

  return (
    <div className="rounded-2xl border border-[#1E293B] bg-[#050816] px-5 sm:px-6">
      {items.map((item, index) => (
        <BriefRow key={item.label} {...item} delay={index * 60} />
      ))}
    </div>
  );
}
