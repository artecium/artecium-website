import type { AppLocale } from "@/i18n/config";
import { getCommercialPlan } from "@/lib/pricing/commercial-catalog";
import {
  formatCommercialMonthly,
  formatCommercialSetup,
} from "@/lib/pricing/format-commercial";

export function buildWebsiteCostAnswer(
  locale: AppLocale,
  options?: { scopeNote?: boolean },
): string {
  const wEss = getCommercialPlan("websites", "essential");
  const wPro = getCommercialPlan("websites", "professional");
  const wBiz = getCommercialPlan("websites", "business");

  const scope =
    options?.scopeNote
      ? locale === "en"
        ? " Final scope depends on features and requirements."
        : " O âmbito final depende das funcionalidades e requisitos."
      : "";

  return locale === "en"
    ? `At Artecium, websites start at ${formatCommercialSetup(locale, wEss.setup)} (Essential) plus ${formatCommercialMonthly(locale, wEss.monthly)}. Professional is ${formatCommercialSetup(locale, wPro.setup)} with ${formatCommercialMonthly(locale, wPro.monthly)}. Business: ${formatCommercialSetup(locale, wBiz.setup)} with ${formatCommercialMonthly(locale, wBiz.monthly)}.${scope}`
    : `Na Artecium, os websites começam nos ${formatCommercialSetup(locale, wEss.setup)} (Essential) + ${formatCommercialMonthly(locale, wEss.monthly)}. O Website Professional custa ${formatCommercialSetup(locale, wPro.setup)} + ${formatCommercialMonthly(locale, wPro.monthly)}. Projetos Business: ${formatCommercialSetup(locale, wBiz.setup)} + ${formatCommercialMonthly(locale, wBiz.monthly)}.${scope}`;
}

export function buildSmallBusinessWebsiteAnswer(locale: AppLocale): string {
  const wEss = getCommercialPlan("websites", "essential");
  const wPro = getCommercialPlan("websites", "professional");
  const wBiz = getCommercialPlan("websites", "business");

  return locale === "en"
    ? `For many small businesses, a well-built professional website is enough. At Artecium, websites start at ${formatCommercialSetup(locale, wEss.setup)} (Essential) with ${formatCommercialMonthly(locale, wEss.monthly)}. If you need more pages, SEO or features, Professional (${formatCommercialSetup(locale, wPro.setup)} + ${formatCommercialMonthly(locale, wPro.monthly)}) or Business (${formatCommercialSetup(locale, wBiz.setup)} + ${formatCommercialMonthly(locale, wBiz.monthly)}) may be a better fit.`
    : `Para muitas pequenas empresas, um website institucional ou profissional bem feito é suficiente. Na Artecium, os websites começam nos ${formatCommercialSetup(locale, wEss.setup)} (Essential) + ${formatCommercialMonthly(locale, wEss.monthly)}. Se precisar de mais páginas, SEO ou funcionalidades, o plano Professional (${formatCommercialSetup(locale, wPro.setup)} + ${formatCommercialMonthly(locale, wPro.monthly)}) ou Business (${formatCommercialSetup(locale, wBiz.setup)} + ${formatCommercialMonthly(locale, wBiz.monthly)}) pode ser mais adequado.`;
}

export function buildAiCostAnswer(locale: AppLocale): string {
  const ai = getCommercialPlan("aiAutomation", "aiSolutions");
  const auto = getCommercialPlan("aiAutomation", "automation");
  const biz = getCommercialPlan("aiAutomation", "businessAutomation");

  return locale === "en"
    ? `Artecium AI Solutions start at ${formatCommercialSetup(locale, ai.setup)} with ${formatCommercialMonthly(locale, ai.monthly)}. Automation projects start at ${formatCommercialSetup(locale, auto.setup)} with ${formatCommercialMonthly(locale, auto.monthly)}. Business automation is quoted individually, with ongoing support ${formatCommercialMonthly(locale, biz.monthly)}.`
    : `As soluções de IA da Artecium (AI Solutions) começam nos ${formatCommercialSetup(locale, ai.setup)} + ${formatCommercialMonthly(locale, ai.monthly)}. Projetos de automação começam nos ${formatCommercialSetup(locale, auto.setup)} + ${formatCommercialMonthly(locale, auto.monthly)}. Soluções Business são orçamentadas individualmente, com acompanhamento ${formatCommercialMonthly(locale, biz.monthly)}.`;
}

export function buildSeoOnlyAnswer(locale: AppLocale): string {
  const seoF = getCommercialPlan("seo", "foundation");
  const seoG = getCommercialPlan("seo", "growth");
  const seoA = getCommercialPlan("seo", "advanced");

  return locale === "en"
    ? `Yes. SEO Foundation (${formatCommercialSetup(locale, seoF.setup)}) is a one-off setup. Ongoing SEO: Growth (${formatCommercialMonthly(locale, seoG.monthly)}) and Advanced (${formatCommercialMonthly(locale, seoA.monthly)}).`
    : `Sim. O SEO Foundation (${formatCommercialSetup(locale, seoF.setup)}) é setup inicial. Para acompanhamento contínuo: Growth (${formatCommercialMonthly(locale, seoG.monthly)}) e Advanced (${formatCommercialMonthly(locale, seoA.monthly)}).`;
}

export function buildSeoCostAnswer(locale: AppLocale): string {
  const seoF = getCommercialPlan("seo", "foundation");
  const seoG = getCommercialPlan("seo", "growth");
  const seoA = getCommercialPlan("seo", "advanced");

  return locale === "en"
    ? `SEO Foundation costs ${formatCommercialSetup(locale, seoF.setup)} as a one-off payment. SEO Growth is ${formatCommercialMonthly(locale, seoG.monthly)} and SEO Advanced is ${formatCommercialMonthly(locale, seoA.monthly)}. Final scope may vary with the website and requirements.`
    : `O SEO Foundation custa ${formatCommercialSetup(locale, seoF.setup)} em pagamento único. O SEO Growth custa ${formatCommercialMonthly(locale, seoG.monthly)} e o SEO Advanced custa ${formatCommercialMonthly(locale, seoA.monthly)}. O âmbito final pode variar consoante o website e os requisitos.`;
}

export function buildCustomProjectCostAnswer(locale: AppLocale): string {
  const wEss = getCommercialPlan("websites", "essential");
  const ai = getCommercialPlan("aiAutomation", "aiSolutions");
  const auto = getCommercialPlan("aiAutomation", "automation");
  const seoF = getCommercialPlan("seo", "foundation");
  const bkS = getCommercialPlan("booking", "starter");
  const bkP = getCommercialPlan("booking", "professional");

  return locale === "en"
    ? `It depends on scope and features. Websites start at ${formatCommercialSetup(locale, wEss.setup)} with ${formatCommercialMonthly(locale, wEss.monthly)}; AI Solutions from ${formatCommercialSetup(locale, ai.setup)} with ${formatCommercialMonthly(locale, ai.monthly)}; automation from ${formatCommercialSetup(locale, auto.setup)} with ${formatCommercialMonthly(locale, auto.monthly)}; SEO from ${formatCommercialSetup(locale, seoF.setup)}; Booking from ${formatCommercialSetup(locale, bkS.setup)} with ${formatCommercialMonthly(locale, bkS.monthly)} (Starter) or ${formatCommercialSetup(locale, bkP.setup)} with ${formatCommercialMonthly(locale, bkP.monthly)} (Professional). More complex projects are quoted individually.`
    : `Depende do âmbito e das funcionalidades. Websites começam nos ${formatCommercialSetup(locale, wEss.setup)} + ${formatCommercialMonthly(locale, wEss.monthly)}; soluções de IA nos ${formatCommercialSetup(locale, ai.setup)} + ${formatCommercialMonthly(locale, ai.monthly)}; automação a partir de ${formatCommercialSetup(locale, auto.setup)} + ${formatCommercialMonthly(locale, auto.monthly)}; SEO a partir de ${formatCommercialSetup(locale, seoF.setup)}; Booking a partir de ${formatCommercialSetup(locale, bkS.setup)} + ${formatCommercialMonthly(locale, bkS.monthly)} (Starter) ou ${formatCommercialSetup(locale, bkP.setup)} + ${formatCommercialMonthly(locale, bkP.monthly)} (Professional). Projetos mais complexos são orçamentados individualmente.`;
}

function normalizeQuestion(question: string): string {
  return question.toLowerCase().replace(/\s+/g, " ").trim();
}

export function resolveCommercialFaqAnswer(
  locale: AppLocale,
  question: string,
): string | null {
  const q = normalizeQuestion(question);

  if (locale === "en") {
    if (
      q.includes("how much does a professional website") ||
      q === "how much does a website cost?"
    ) {
      return buildWebsiteCostAnswer(locale, { scopeNote: true });
    }
    if (q.includes("how much does a website cost for a small business")) {
      return buildSmallBusinessWebsiteAnswer(locale);
    }
    if (q.includes("how much does it cost to implement ai")) {
      return buildAiCostAnswer(locale);
    }
    if (q === "how much does seo cost?") {
      return buildSeoCostAnswer(locale);
    }
    if (q.includes("how much does a custom project cost")) {
      return buildCustomProjectCostAnswer(locale);
    }
    if (q.includes("can i hire only seo") || q.includes("seo only")) {
      return buildSeoOnlyAnswer(locale);
    }
    return null;
  }

  if (
    q.includes("quanto custa criar um website profissional") ||
    q === "quanto custa criar um website?"
  ) {
    return buildWebsiteCostAnswer(locale, { scopeNote: true });
  }
  if (q.includes("quanto custa fazer um website para uma pequena empresa")) {
    return buildSmallBusinessWebsiteAnswer(locale);
  }
  if (q.includes("quanto custa implementar ia")) {
    return buildAiCostAnswer(locale);
  }
  if (q === "quanto custa seo?") {
    return buildSeoCostAnswer(locale);
  }
  if (q.includes("quanto custa um projeto personalizado")) {
    return buildCustomProjectCostAnswer(locale);
  }
  if (q.includes("posso contratar apenas seo")) {
    return buildSeoOnlyAnswer(locale);
  }

  return null;
}

export function buildClientPreviewDemoPlanLine(locale: AppLocale): string {
  const proMonthly = formatCommercialMonthly(
    locale,
    getCommercialPlan("websites", "professional").monthly,
  );
  return locale === "en"
    ? `Demo example · Professional · ${proMonthly}`
    : `Exemplo (demonstração) · Professional · ${proMonthly}`;
}

export function buildClientPreviewDemoPaymentLine(locale: AppLocale): string {
  return locale === "en"
    ? "Demo example: €123.00 · completed"
    : "Exemplo (demonstração): 123 € · concluído";
}

export function buildClientPreviewDemoPlanSummary(locale: AppLocale): string {
  return locale === "en"
    ? "Demo example · Website maintenance · Professional"
    : "Exemplo (demonstração) · Manutenção de Website · Professional";
}