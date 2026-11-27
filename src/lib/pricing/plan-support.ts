import type { PricingCategory } from "@/lib/pricing/config";

export type PlanLimitKind =
  | "available"
  | "commercial_only"
  | "not_implemented"
  | "technical_other";

export type PlanSupportRow = {
  category: PricingCategory;
  planKey: string;
  feature: string;
  kind: PlanLimitKind;
  notes: string;
};

/**
 * Correspondência comercial vs capacidade técnica atual (março 2026).
 * Limites "commercial_only" aparecem na UI mas não são aplicados em código.
 */
export const PLAN_SUPPORT_MATRIX: readonly PlanSupportRow[] = [
  {
    category: "booking",
    planKey: "starter",
    feature: "Limite de reservas mensais (100)",
    kind: "commercial_only",
    notes: "Texto em home-pricing; booking_business_subscriptions sem quotas.",
  },
  {
    category: "booking",
    planKey: "professional",
    feature: "Integração Google Calendar",
    kind: "available",
    notes: "OAuth + tokens em produção; depende de configuração por negócio.",
  },
  {
    category: "booking",
    planKey: "business",
    feature: "Integrações/API",
    kind: "not_implemented",
    notes: "Comercial proposto; sem API pública de billing/planos Booking.",
  },
  {
    category: "aiAutomation",
    planKey: "aiSolutions",
    feature: "Limite de interações mensais",
    kind: "commercial_only",
    notes: "Campo commercialLimit na homepage; sem metering.",
  },
  {
    category: "websites",
    planKey: "essential",
    feature: "Mensalidade 29 € (entitlements portal)",
    kind: "not_implemented",
    notes: "Supabase: service_plans só para Manutenção (50/100/200 €), não este catálogo.",
  },
];