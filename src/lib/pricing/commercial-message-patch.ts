import type { AppLocale } from "@/i18n/config";
import {
  getCommercialPlan,
  WEB_APPLICATION_SETUP_FROM_EUR,
} from "@/lib/pricing/commercial-catalog";
import {
  buildClientPreviewDemoPaymentLine,
  buildClientPreviewDemoPlanLine,
  buildClientPreviewDemoPlanSummary,
  buildSeoOnlyAnswer,
  buildWebsiteCostAnswer,
  resolveCommercialFaqAnswer,
} from "@/lib/pricing/commercial-faq-copy";
import {
  formatCommercialMonthly,
  formatCommercialSetup,
  formatSetupAndMonthlyLine,
} from "@/lib/pricing/format-commercial";
import type { PricingCategory } from "@/lib/pricing/config";

type Messages = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepWalkStrings(
  node: unknown,
  replacers: Array<(value: string) => string>,
): unknown {
  if (typeof node === "string") {
    return replacers.reduce((acc, fn) => fn(acc), node);
  }
  if (Array.isArray(node)) {
    return node.map((item) => deepWalkStrings(item, replacers));
  }
  if (isRecord(node)) {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node)) {
      out[key] = deepWalkStrings(value, replacers);
    }
    return out;
  }
  return node;
}

const SERVICE_CATEGORY_MAP: Record<
  string,
  { category: PricingCategory; planKeys: string[] }
> = {
  websites: { category: "websites", planKeys: ["essential", "professional", "business"] },
  ai: { category: "aiAutomation", planKeys: ["aiSolutions", "automation", "businessAutomation"] },
  seo: { category: "seo", planKeys: ["foundation", "growth", "advanced"] },
};

function patchServicePricing(
  locale: AppLocale,
  messages: Messages,
): void {
  const services = messages.services;
  if (!isRecord(services)) return;

  for (const [serviceKey, mapping] of Object.entries(SERVICE_CATEGORY_MAP)) {
    const service = services[serviceKey];
    if (!isRecord(service)) continue;
    const pricing = service.pricing;
    if (!isRecord(pricing)) continue;
    const plans = pricing.plans;
    if (!isRecord(plans)) continue;

    for (const planKey of mapping.planKeys) {
      const plan = plans[planKey];
      if (!isRecord(plan)) continue;
      const commercial = getCommercialPlan(mapping.category, planKey);
      const setup = formatCommercialSetup(locale, commercial.setup);
      const monthly = formatCommercialMonthly(locale, commercial.monthly);

      if (mapping.category === "seo" && planKey === "foundation") {
        plan.price = setup;
      } else if (mapping.category === "seo") {
        plan.price = monthly ?? setup;
      } else if (commercial.setup.kind === "custom" && monthly) {
        plan.price = monthly;
      } else {
        plan.price = formatSetupAndMonthlyLine(
          locale,
          commercial.setup,
          commercial.monthly,
        );
      }

      if (monthly && mapping.category === "websites") {
        plan.priceNote =
          locale === "en"
            ? `Ongoing support: ${monthly}`
            : `Acompanhamento: ${monthly}`;
      }
    }
  }
}

function patchHomeClientPreview(locale: AppLocale, messages: Messages): void {
  const home = messages.home;
  if (!isRecord(home)) return;
  const clientArea = home.clientArea;
  if (!isRecord(clientArea)) return;
  const preview = clientArea.preview;
  if (!isRecord(preview)) return;

  preview.planGrowth = buildClientPreviewDemoPlanLine(locale);
  preview.latestPayment = buildClientPreviewDemoPaymentLine(locale);
  preview.planSummary = buildClientPreviewDemoPlanSummary(locale);
}

function patchHomeFaq(locale: AppLocale, messages: Messages): void {
  const home = messages.home;
  if (!isRecord(home)) return;

  const faqPreview = home.faqPreview;
  if (isRecord(faqPreview) && isRecord(faqPreview.items)) {
    const items = faqPreview.items;
    if (isRecord(items.websiteCost)) {
      items.websiteCost.answer = buildWebsiteCostAnswer(locale);
    }
    if (isRecord(items.seoOnly)) {
      items.seoOnly.answer = buildSeoOnlyAnswer(locale);
    }
  }
}

function patchFaqAnswersRecursive(node: unknown, locale: AppLocale): void {
  if (Array.isArray(node)) {
    for (const item of node) {
      if (
        isRecord(item) &&
        typeof item.question === "string" &&
        typeof item.answer === "string"
      ) {
        const resolved = resolveCommercialFaqAnswer(locale, item.question);
        if (resolved) {
          item.answer = resolved;
        }
      }
      patchFaqAnswersRecursive(item, locale);
    }
    return;
  }
  if (isRecord(node)) {
    for (const value of Object.values(node)) {
      patchFaqAnswersRecursive(value, locale);
    }
  }
}

/** Align inline Artecium website tier mentions in blog/educational copy. */
function patchArteciumWebsiteTierParagraph(locale: AppLocale, value: string): string {
  const catalogLine = buildWebsiteCostAnswer(locale);
  const replacements: Array<[RegExp, string]> =
    locale === "en"
      ? [
          [
            /At Artecium, websites start at 750 € \(Essential\) and the Professional plan costs 1,?500 €\. Advanced projects[^.]*\./,
            `${catalogLine} Projects with advanced features may fit the Business tier.`,
          ],
          [
            /At Artecium, the Essential plan \(750 €\)[^.]*Business projects \(from 2,?500 €\)[^.]*\./,
            catalogLine,
          ],
        ]
      : [
          [
            /Na Artecium, websites começam nos 750 € \(Essential\) e o plano Professional custa 1\.500 €\. Projetos com funcionalidades avançadas[^.]*\./,
            `${catalogLine} Projetos com funcionalidades avançadas podem enquadrar-se no plano Business.`,
          ],
          [
            /Na Artecium, o plano Essential \(750 €\) cobre[^.]*Projetos Business \(desde 2\.500 €\)[^.]*\./,
            catalogLine,
          ],
        ];

  let out = value;
  for (const [pattern, replacement] of replacements) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

export function applyCommercialPricingToMessages(
  locale: AppLocale,
  messages: Messages,
): Messages {
  const cloned = structuredClone(messages) as Messages;
  patchServicePricing(locale, cloned);
  patchHomeClientPreview(locale, cloned);
  patchHomeFaq(locale, cloned);
  patchFaqAnswersRecursive(cloned, locale);

  const webApp =
    locale === "en"
      ? `€${WEB_APPLICATION_SETUP_FROM_EUR.toLocaleString("en-GB")}`
      : `${WEB_APPLICATION_SETUP_FROM_EUR.toLocaleString("pt-PT")} €`;

  return deepWalkStrings(cloned, [
    (s) => s.replace(/from €3,500/g, `from ${webApp}`),
    (s) => s.replace(/a partir de 3\.500 €/g, `a partir de ${webApp}`),
    (s) => patchArteciumWebsiteTierParagraph(locale, s),
  ]) as Messages;
}