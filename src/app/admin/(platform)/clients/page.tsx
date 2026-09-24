import { AdminSearchBar } from "@/components/admin/AdminSearchBar";
import { AdminTable } from "@/components/admin/AdminTable";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { requireAdminPage } from "@/lib/auth/admin-access";
import { getAdminCompanies } from "@/lib/data/admin/queries";
import { formatDate, listSectionMessage } from "@/lib/data/client-format";
import { PERMISSIONS } from "@/types/platform";
import Link from "next/link";
import { Suspense } from "react";

interface ClientsPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminClientsPage({ searchParams }: ClientsPageProps) {
  const session = await requireAdminPage(PERMISSIONS.CLIENTS_VIEW);
  const { q } = await searchParams;
  const result = await getAdminCompanies(q);
  const section = listSectionMessage(
    result,
    "No clients yet",
    "Client companies will appear here once created in Supabase.",
  );

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Manage client companies and open Customer 360 views."
        actions={
          session.profile.permissions.includes(PERMISSIONS.CLIENTS_EDIT) ? (
            <Link
              href="/admin/clients/new"
              className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8]"
            >
              Novo cliente
            </Link>
          ) : undefined
        }
      />

      <div className="mb-6">
        <Suspense>
          <AdminSearchBar placeholder="Search by name or tax ID..." defaultValue={q ?? ""} />
        </Suspense>
      </div>

      {section.hasData ? (
        <AdminTable
          rows={result.data}
          rowKey={(row) => row.id}
          columns={[
            {
              key: "name",
              header: "Empresa",
              render: (row) => (
                <Link href={`/admin/clients/${row.id}`} className="font-medium text-[#93C5FD] hover:underline">
                  {row.name}
                </Link>
              ),
            },
            {
              key: "website",
              header: "Website",
              render: (row) => row.website ?? "—",
            },
            {
              key: "status",
              header: "Estado",
              render: () => <StatusBadge label="ACTIVE" tone="success" />,
            },
            {
              key: "projects",
              header: "Projetos",
              render: (row) => row.project_count,
            },
            {
              key: "services",
              header: "Serviços",
              render: (row) => row.subscription_count,
            },
            {
              key: "created",
              header: "Criado",
              render: (row) => formatDate(row.created_at),
            },
          ]}
        />
      ) : (
        <EmptyState title={section.emptyTitle} description={section.emptyDescription} />
      )}
    </>
  );
}
