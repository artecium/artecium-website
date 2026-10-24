import { FeatureList, UsageProgressBar } from "@/components/platform/ClientServicesPanel";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { resolveLocale } from "@/i18n/config";
import {
  formatBillingSuffix,
  formatCurrency,
  formatDate,
  formatStatusLabel,
} from "@/lib/data/client-format";
import {
  getClientServicesOverview,
  getServicesSchemaState,
} from "@/lib/data/client-subscriptions";
import { requireClientAuth } from "@/lib/auth/session";
import { getLocale, getTranslations } from "next-intl/server";

export async function ClientServicesContent() {
  const locale = resolveLocale(await getLocale());
  const t = await getTranslations("services");
  const tCommon = await getTranslations("common");
  const tBilling = await getTranslations("billing");
  const tStatus = await getTranslations("status");

  const session = await requireClientAuth();
  const companyIds = session.profile.company_ids;
  const schema = await getServicesSchemaState(companyIds);
  const overviews = await getClientServicesOverview(companyIds);

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      {!schema.configured ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {schema.message}
        </div>
      ) : null}

      {!overviews.length ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
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
                      {subscription.service?.name ?? tCommon("unknown")}
                    </h2>
                    <StatusBadge
                      label={formatStatusLabel(subscription.status, tStatus)}
                      tone="info"
                    />
                  </div>
                  {subscription.plan ? (
                    <p className="mt-1 text-sm text-[#94A3B8]">
                      {t("plan")}:{" "}
                      <span className="text-white">{subscription.plan.name}</span>
                    </p>
                  ) : subscription.billing_period === "one_time" ? (
                    <p className="mt-1 text-sm text-[#94A3B8]">{t("oneTimeService")}</p>
                  ) : (
                    <p className="mt-1 text-sm text-[#94A3B8]">{t("customService")}</p>
                  )}
                </div>
                <div className="text-sm text-[#94A3B8]">
                  <p>
                    {t("price")}:{" "}
                    <span className="text-white">
                      {subscription.price !== null
                        ? formatCurrency(subscription.price, subscription.currency, locale)
                        : tCommon("custom")}
                      {subscription.price !== null
                        ? formatBillingSuffix(subscription.billing_period, tBilling)
                        : ""}
                    </span>
                  </p>
                  <p className="mt-1">
                    {t("started")}: {formatDate(subscription.started_at, locale)}
                  </p>
                  <p className="mt-1">
                    {t("nextRenewal")}:{" "}
                    {formatDate(subscription.current_period_end, locale)}
                  </p>
                </div>
              </div>

              {entitlements.length ? (
                <div className="mt-6">
                  <FeatureList
                    title={t("includedFeatures")}
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
                  <h3 className="text-base font-medium text-white">{t("usage")}</h3>
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
