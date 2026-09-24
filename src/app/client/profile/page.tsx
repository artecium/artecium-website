import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { getClientProfileContext } from "@/lib/data/client-profile";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { requireClientAuth } from "@/lib/auth/session";

export default async function ClientProfilePage() {
  const session = await requireClientAuth();
  const dbState = await getDatabaseReadyState();
  const profileResult = await getClientProfileContext(session.profile);
  const context = profileResult.data;

  if (profileResult.accessDenied || profileResult.error) {
    return (
      <>
        <PageHeader title="Profile" description="Your account details and preferences." />
        <EmptyState
          title="Unable to load profile"
          description={
            profileResult.accessDenied
              ? "Access to your profile was denied."
              : "Something went wrong while loading your profile."
          }
        />
      </>
    );
  }

  const { profile, companies } = context ?? { profile: session.profile, companies: [] };

  return (
    <>
      <PageHeader
        title="Profile"
        description="Your account details and preferences."
      />

      {!dbState.configured ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {dbState.message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
          <h2 className="text-base font-medium text-white">Account</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#64748B]">Name</dt>
              <dd className="mt-0.5 text-white">{profile.full_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#64748B]">Email</dt>
              <dd className="mt-0.5 text-[#94A3B8]">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#64748B]">Locale</dt>
              <dd className="mt-0.5 text-[#94A3B8]">{profile.locale}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#64748B]">Currency</dt>
              <dd className="mt-0.5 text-[#94A3B8]">{profile.currency}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#64748B]">Roles</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {profile.roles.map((role) => (
                  <StatusBadge key={role} label={role} tone="info" />
                ))}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
          <h2 className="text-base font-medium text-white">Companies</h2>
          {companies.length ? (
            <ul className="mt-4 space-y-3">
              {companies.map((company) => (
                <li
                  key={company.id}
                  className="rounded-xl border border-[#1E293B] bg-[#050816]/40 px-4 py-3"
                >
                  <p className="text-sm font-medium text-white">{company.name}</p>
                  {company.tax_id ? (
                    <p className="mt-1 text-xs text-[#64748B]">{company.tax_id}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[#64748B]">No companies linked to this account.</p>
          )}
        </section>
      </div>
    </>
  );
}
