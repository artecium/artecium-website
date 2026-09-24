const fs = require("fs");
const path = require("path");

const adminPages = [
  "dashboard",
  "leads",
  "clients",
  "companies",
  "projects",
  "tasks",
  "team",
  "services",
  "plans",
  "proposals",
  "contracts",
  "approvals",
  "change-requests",
  "deliverables",
  "support",
  "invoices",
  "payments",
  "subscriptions",
  "analytics",
  "seo",
  "reports",
  "documents",
  "domains",
  "hosting",
  "ssl",
  "meetings",
  "feedback",
  "notifications",
  "activity",
  "integrations",
  "partners",
  "referrals",
  "users",
  "roles",
  "settings",
];

const base = path.join(__dirname, "src/app/admin/(platform)");

function toTitle(slug) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

for (const slug of adminPages) {
  const title = toTitle(slug);
  const dir = path.join(base, slug);
  fs.mkdirSync(dir, { recursive: true });
  const content = `import { ModulePage } from "@/components/platform/ModulePage";
import { getDatabaseReadyState } from "@/lib/data/platform-state";

export default async function Page() {
  const dbState = await getDatabaseReadyState();

  return (
    <ModulePage
      title="${title}"
      description="Manage ${title.toLowerCase()} across the Artecium platform."
      emptyTitle="No ${title.toLowerCase()} data yet"
      emptyDescription="Admin data will appear here once Supabase is configured and populated."
      setupMessage={dbState.configured ? undefined : dbState.message}
    />
  );
}
`;
  fs.writeFileSync(path.join(dir, "page.tsx"), content);
}

const projectDetail = path.join(
  __dirname,
  "src/app/client/projects/[id]/page.tsx",
);
fs.mkdirSync(path.dirname(projectDetail), { recursive: true });
fs.writeFileSync(
  projectDetail,
  `import { ModulePage } from "@/components/platform/ModulePage";
import { getDatabaseReadyState } from "@/lib/data/platform-state";

export default async function ProjectDetailPage() {
  const dbState = await getDatabaseReadyState();

  return (
    <ModulePage
      title="Project details"
      description="Timeline, tasks, deliverables, approvals, change requests, and project communication."
      emptyTitle="Project not found or not yet available"
      emptyDescription="Project details will load from Supabase once the database is configured."
      setupMessage={dbState.configured ? undefined : dbState.message}
    />
  );
}
`,
);

console.log("Generated admin and project detail pages");
