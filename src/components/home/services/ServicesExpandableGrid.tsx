"use client";

import { ServiceExpandableCard } from "./ServiceExpandableCard";
import type { ServiceCardItem, ServiceCardsLabels } from "./types";

interface ServicesExpandableGridProps {
  items: ServiceCardItem[];
  labels: ServiceCardsLabels;
}

export function ServicesExpandableGrid({
  items,
  labels,
}: ServicesExpandableGridProps) {
  return (
    <div className="mt-16 grid gap-5 lg:grid-cols-3">
      {items.map((item) => (
        <ServiceExpandableCard key={item.id} {...item} labels={labels} />
      ))}
    </div>
  );
}