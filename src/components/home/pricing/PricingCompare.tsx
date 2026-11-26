"use client";

import type { PricingCategory } from "@/lib/pricing/config";
import { PLANS_BY_CATEGORY } from "@/lib/pricing/config";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

type CompareRow = { feature: string; values: string[] };

function CompareCell({ value, labels }: { value: string; labels: { yes: string; no: string } }) {
  if (value === "yes") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[#CBD5E1]">
        <span className="text-[#2563EB]" aria-hidden="true">
          ✓
        </span>
        <span className="sr-only">{labels.yes}</span>
      </span>
    );
  }
  if (value === "no") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[#64748B]">
        <span aria-hidden="true">—</span>
        <span className="sr-only">{labels.no}</span>
      </span>
    );
  }
  return <span className="text-[#CBD5E1]">{value}</span>;
}

export function PricingCompare({ category }: { category: PricingCategory }) {
  const t = useTranslations("home.pricing");
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const planKeys = PLANS_BY_CATEGORY[category];
  const rows = t.raw(
    `categories.${category}.comparison.rows`,
  ) as CompareRow[];

  const labels = {
    yes: t("compare.included"),
    no: t("compare.notIncluded"),
  };

  return (
    <div className="mt-10 border-t border-[#1E293B]/80 pt-8">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 rounded-xl border border-[#1E293B] bg-[#0E1324]/60 px-4 py-3 text-left text-sm font-medium text-white transition-colors hover:border-[#2563EB]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 sm:px-5"
      >
        {t("compare.toggle")}
        <span
          className={`text-[#64748B] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open ? (
        <div
          id={panelId}
          className="motion-safe:animate-in motion-safe:fade-in mt-4 overflow-x-auto rounded-xl border border-[#1E293B] bg-[#0E1324]/40"
        >
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#1E293B]">
                <th
                  scope="col"
                  className="px-4 py-3 font-medium text-[#94A3B8] sm:px-5"
                >
                  {t("compare.featureColumn")}
                </th>
                {planKeys.map((planKey) => (
                  <th
                    key={planKey}
                    scope="col"
                    className="px-4 py-3 font-semibold text-white sm:px-5"
                  >
                    {t(`categories.${category}.plans.${planKey}.name`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.feature}
                  className="border-b border-[#1E293B]/60 last:border-0"
                >
                  <th
                    scope="row"
                    className="px-4 py-3 font-normal text-[#94A3B8] sm:px-5"
                  >
                    {row.feature}
                  </th>
                  {row.values.map((value, index) => (
                    <td key={`${row.feature}-${index}`} className="px-4 py-3 sm:px-5">
                      <CompareCell value={value} labels={labels} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}