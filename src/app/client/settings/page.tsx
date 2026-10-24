import { PageHeader } from "@/components/platform/PageHeader";
import { getDatabaseReadyState } from "@/lib/data/platform-state";
import { requireClientAuth } from "@/lib/auth/session";
import { getTranslations } from "next-intl/server";

export default async function ClientSettingsPage() {
  const t = await getTranslations("settings");
  const tCommon = await getTranslations("common");

  const session = await requireClientAuth();
  const dbState = await getDatabaseReadyState();
  const { profile } = session;

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      {!dbState.configured ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {dbState.message}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
        <h2 className="text-base font-medium text-white">{t("preferences")}</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#64748B]">
              {tCommon("locale")}
            </dt>
            <dd className="mt-0.5 text-[#94A3B8]">{profile.locale}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[#64748B]">
              {tCommon("currency")}
            </dt>
            <dd className="mt-0.5 text-[#94A3B8]">{profile.currency}</dd>
          </div>
        </dl>
        <p className="mt-6 text-sm text-[#64748B]">{t("notAvailableNote")}</p>
      </div>
    </>
  );
}
