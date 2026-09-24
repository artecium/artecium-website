import { FeatureList, UsageProgressBar } from "@/components/platform/ClientServicesPanel";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import {
  formatBillingSuffix,
  formatCurrency,
  formatDate,
} from "@/lib/data/client-format";
import {
  getClientServicesOverview,
  getServicesSchemaState,
} from "@/lib/data/client-subscriptions";
import { requireClientAuth } from "@/lib/auth/session";

export async function ClientServicesContent() {
  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;
  const schema = await getServicesSchemaState(companyIds);
  const overviews = await getClientServicesOverview(companyIds);

  return (
    <>
      <PageHeader
        title="My services"
        description="Your contracted services, plans, entitlements, and monthly usage."
      />

      {!schema.configured ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {schema.message}
        </div>
      ) : null}

      {!overviews.length ? (
        <EmptyState
          title="No services contracted yet"
          description="Your active services and maintenance plans will appear here once assigned by Artecium."
        />
      ) : (
        <div className="space-y-8">
          {overviews.map(({ subscription, entitlements, usage }) => (
            <section
              key={subscription.id}
              className="rounded-2xl border border-[#1E293B] bg-[#0E1324]/60 p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-white">
                      {subscription.service?.name ?? "Service"}
                    </h2>
                    <StatusBadge label={subscription.status} tone="info" />
                  </div>
                  {subscription.plan ? (
                    <p className="mt-1 text-sm text-[#94A3B8]">
                      Plan:{" "}
                      <span className="text-white">{subscription.plan.name}</span>
                    </p>
                  ) : subscription.billing_period === "one_time" ? (
                    <p className="mt-1 text-sm text-[#94A3B8]">One-time service</p>
                  ) : (
                    <p className="mt-1 text-sm text-[#94A3B8]">Custom service</p>
                  )}
                </div>
                <div className="text-sm text-[#94A3B8]">
                  <p>
                    Price:{" "}
                    <span className="text-white">
                      {subscription.price !== null
                        ? formatCurrency(subscription.price, subscription.currency)
                        : "Custom"}
                      {subscription.price !== null
                        ? formatBillingSuffix(subscription.billing_period)
                        : ""}
                    </span>
                  </p>
                  <p className="mt-1">
                    Started: {formatDate(subscription.started_at)}
                  </p>
                  <p className="mt-1">
                    Next renewal:{" "}
                    {formatDate(subscription.current_period_end)}
                  </p>
                </div>
              </div>

              {entitlements.length ? (
                <div className="mt-6">
                  <FeatureList
                    title="Included features"
                    features={entitlements.map((feature) => ({
                      name: feature.feature_name,
                      detail:
                        feature.value_type === "numeric" &&
                        feature.limit_value !== null
                          ? `${feature.limit_value} ${feature.limit_unit ?? ""}`.trim()
                          : undefined,
                    }))}
                  />
                </div>
              ) : null}

              {usage.length ? (
                <div className="mt-6 space-y-4">
                  <h3 className="text-base font-medium text-white">Usage</h3>
                  {usage.map((item) => (
                    <UsageProgressBar
                      key={item.feature_slug}
                      label={item.feature_name}
                      used={item.used}
                      limit={item.limit}
                      unit={item.unit}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
