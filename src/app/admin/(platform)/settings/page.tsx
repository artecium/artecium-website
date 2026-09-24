import { PageHeader } from "@/components/platform/PageHeader";
import { PlatformCard } from "@/components/platform/PlatformCard";
import { requireAdminPage } from "@/lib/auth/admin-access";
import { PERMISSIONS } from "@/types/platform";

export default async function AdminSettingsPage() {
  const session = await requireAdminPage(PERMISSIONS.SETTINGS_MANAGE);

  return (
    <>
      <PageHeader
        title="Definições"
        description="Platform settings and staff preferences."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <PlatformCard
          title="Profile"
          description={`Signed in as ${session.profile.email}`}
        />
        <PlatformCard
          title="Roles"
          description={session.profile.roles.join(", ")}
        />
        <PlatformCard
          title="Integrations"
          description="Stripe, email, and external integrations — Phase 2."
        />
        <PlatformCard
          title="Security"
          description="RLS enforced. No service role in browser."
        />
      </div>
    </>
  );
}
