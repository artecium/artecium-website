import { ModulePage } from "@/components/platform/ModulePage";
import { adminNavItems } from "@/config/navigation/platform";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { notFound } from "next/navigation";

interface AdminModulePageProps {
  params: Promise<{ module: string }>;
}

export function generateStaticParams() {
  return adminNavItems
    .map((item) => item.href.replace("/admin/", ""))
    .filter((slug) => slug !== "dashboard")
    .map((module) => ({ module }));
}

export default async function AdminModulePage({ params }: AdminModulePageProps) {
  const { module } = await params;
  const navItem = adminNavItems.find((item) => item.href === `/admin/${module}`);

  if (!navItem || module === "dashboard") {
    notFound();
  }

  const dbState = await getDatabaseReadyState();

  return (
    <ModulePage
      title={navItem.label}
      description={`Manage ${navItem.label.toLowerCase()} across the Artecium platform.`}
      emptyTitle={`No ${navItem.label.toLowerCase()} data yet`}
      emptyDescription="Admin data will appear here once Supabase is configured and populated."
      setupMessage={dbState.configured ? undefined : dbState.message}
    />
  );
}
