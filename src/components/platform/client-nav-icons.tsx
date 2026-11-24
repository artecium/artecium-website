import type { ReactNode } from "react";

/** Icons for client area sidebar (inline SVG — no extra icon library). */
export type ClientNavIconId =
  | "overview"
  | "projects"
  | "services"
  | "analytics"
  | "seo"
  | "reports"
  | "meetings"
  | "feedback"
  | "support"
  | "invoices"
  | "payments"
  | "documents"
  | "notifications"
  | "profile"
  | "settings"
  | "analyticsSeo"
  | "financial"
  | "account";

const stroke = {
  fill: "none" as const,
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconPath({ d }: { d: string }) {
  return (
    <svg className="h-[18px] w-[18px] shrink-0 opacity-90" aria-hidden {...stroke}>
      <path d={d} />
    </svg>
  );
}

const paths: Record<ClientNavIconId, string> = {
  overview:
    "M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 12a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z",
  projects:
    "M3 7.5A1.5 1.5 0 014.5 6h15A1.5 1.5 0 0121 7.5v9a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 16.5v-9zM8 6V4.5A1.5 1.5 0 019.5 3h5A1.5 1.5 0 0116 4.5V6",
  services:
    "M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5",
  analytics:
    "M4 19V5M4 19h16M8 17V9M12 17V7M16 17v-4",
  seo: "M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z",
  reports:
    "M9 17v-6M12 17V7M15 17v-3M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z",
  meetings:
    "M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  feedback:
    "M7 8h10M7 12h6M5 20l2.5-3H19a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v11z",
  support:
    "M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M9 10h.01M9 14h.01M12 18a6 6 0 01-4.243-1.757L3 19l2.757-4.757A6 6 0 1112 18z",
  invoices:
    "M9 14l2 2 4-4M7 3h10a2 2 0 012 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 012-2z",
  payments:
    "M3 10h18M7 15h2m4 0h2M6 6h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z",
  documents:
    "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6",
  notifications:
    "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  profile:
    "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  settings:
    "M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  analyticsSeo:
    "M4 19V5M4 19h16M8 17V9M12 17V7M16 17v-4M20 20l-3-3",
  financial:
    "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  account:
    "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
};

export function ClientNavIcon({ id }: { id: ClientNavIconId }): ReactNode {
  return <IconPath d={paths[id]} />;
}
