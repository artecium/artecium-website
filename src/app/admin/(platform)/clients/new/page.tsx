import { CreateCompanyForm } from "@/components/admin/CreateCompanyForm";
import { PageHeader } from "@/components/platform/PageHeader";
import { requireAdminPage } from "@/lib/auth/admin-access";
import { PERMISSIONS } from "@/types/platform";

export default async function NewClientPage() {
  await requireAdminPage(PERMISSIONS.CLIENTS_EDIT);

  return (
    <>
      <PageHeader
        title="Novo cliente"
        description="Create a new company record in Supabase."
      />
      <CreateCompanyForm />
    </>
  );
}
