import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";

interface ModulePageProps {
  title: string;
  description: string;
  emptyTitle?: string;
  emptyDescription?: string;
  setupMessage?: string;
}

export function ModulePage({
  title,
  description,
  emptyTitle,
  emptyDescription,
  setupMessage,
}: ModulePageProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      {setupMessage ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {setupMessage}
        </div>
      ) : null}
      <EmptyState
        title={emptyTitle ?? "No data available yet"}
        description={
          emptyDescription ??
          "This module is ready. Data will appear here once configured in Supabase."
        }
      />
    </>
  );
}
