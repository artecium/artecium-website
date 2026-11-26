"use client";

import {
  FEATURED_PLAN_BY_CATEGORY,
  PLANS_BY_CATEGORY,
  type PricingCategory,
} from "@/lib/pricing/config";
import { useEffect, useState } from "react";
import { PricingExpandablePlanCard } from "./PricingExpandablePlanCard";

export function PricingExpandablePlans({
  category,
}: {
  category: PricingCategory;
}) {
  const [openPlanKey, setOpenPlanKey] = useState<string | null>(null);
  const featuredPlanKey = FEATURED_PLAN_BY_CATEGORY[category];

  useEffect(() => {
    setOpenPlanKey(null);
  }, [category]);

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {PLANS_BY_CATEGORY[category].map((planKey) => (
        <PricingExpandablePlanCard
          key={`${category}-${planKey}`}
          category={category}
          planKey={planKey}
          featured={featuredPlanKey === planKey}
          isOpen={openPlanKey === planKey}
          onOpen={() => setOpenPlanKey(planKey)}
          onClose={() => setOpenPlanKey(null)}
        />
      ))}
    </div>
  );
}