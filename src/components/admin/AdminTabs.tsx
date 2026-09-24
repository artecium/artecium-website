import Link from "next/link";

export interface AdminTab {
  id: string;
  label: string;
}

interface AdminTabsProps {
  tabs: AdminTab[];
  activeTab: string;
  basePath: string;
}

export function AdminTabs({ tabs, activeTab, basePath }: AdminTabsProps) {
  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-[#1E293B] pb-4">
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <Link
            key={tab.id}
            href={`${basePath}?tab=${tab.id}`}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              active
                ? "bg-[#2563EB]/20 text-[#93C5FD]"
                : "text-[#94A3B8] hover:bg-[#0E1324] hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
