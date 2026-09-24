import { PageHeader } from "@/components/platform/PageHeader";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { requireClientAuth } from "@/lib/auth/session";

export default async function ClientSettingsPage() {
  const session = await requireClientAuth();
  const dbState = await getDatabaseReadyState();
  const { profile } = session;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account preferences."
      />

      {!dbState.configured ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {dbState.message}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
        <h2 className="text-base font-medium text-white">Preferences</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#64748B]">Locale</dt>
            <dd className="mt-0.5 text-[#94A3B8]">{profile.locale}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#64748B]">Currency</dt>
            <dd className="mt-0.5 text-[#94A3B8]">{profile.currency}</dd>
          </div>
        </dl>
        <p className="mt-6 text-sm text-[#64748B]">
          Notification preferences and profile editing are not yet available in the client portal.
        </p>
      </div>
    </>
  );
}
