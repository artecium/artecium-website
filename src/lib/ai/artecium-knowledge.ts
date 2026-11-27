/**
 * Official Artecium knowledge base for the FAQ AI assistant.
 * Commercial amounts are sourced from `commercial-catalog` (single source of truth).
 */
import {
  COMMERCIAL_CATALOG,
  WEB_APPLICATION_SETUP_FROM_EUR,
  getCommercialPlan,
} from "@/lib/pricing/commercial-catalog";
import {
  formatCommercialMonthly,
  formatCommercialSetup,
} from "@/lib/pricing/format-commercial";

const LOCALE = "en" as const;

function formatSetupAndMonthlyKnowledge(
  setup: Parameters<typeof formatCommercialSetup>[1],
  monthly: Parameters<typeof formatCommercialMonthly>[1],
): string {
  const setupStr = formatCommercialSetup(LOCALE, setup);
  const monthlyStr = formatCommercialMonthly(LOCALE, monthly);
  if (!monthlyStr) return setupStr;
  return `${setupStr} + ${monthlyStr}`;
}

const WEBSITE_INCLUDES: Record<string, string[]> = {
  essential: [
    "Up to 5 pages",
    "Custom design",
    "Responsive layout",
    "Contact form",
    "WhatsApp integration",
    "Basic technical SEO",
    "Analytics",
    "Deployment",
  ],
  professional: [
    "Up to 10 pages",
    "Advanced design",
    "Animations and interactions",
    "Advanced forms",
    "Integrations",
    "On-page SEO",
    "Google Search Console",
    "Conversion optimisation",
    "Analytics",
  ],
  business: [
    "Custom website",
    "Client area / reserved area",
    "Integrations",
    "Automation",
    "AI",
    "Booking systems",
    "APIs",
    "Custom functionality",
  ],
};

const AI_EXAMPLES: Record<string, string[]> = {
  aiSolutions: [
    "Chatbots",
    "AI assistants",
    "Smart forms",
    "Content generation",
    "Lead qualification",
  ],
  automation: [
    "CRM",
    "Workflows",
    "Integrations",
    "APIs",
    "Automated emails",
    "Data processing",
  ],
  businessAutomation: [
    "AI agents",
    "Internal systems",
    "Complex integrations",
    "Advanced automation",
  ],
};

const SEO_INCLUDES: Record<string, string[]> = {
  foundation: [
    "SEO audit",
    "Technical SEO",
    "Metadata",
    "Heading structure",
    "Sitemap",
    "Search Console",
    "Indexing",
    "Base schema",
  ],
  growth: [
    "Ongoing optimisation",
    "Keyword research",
    "Content",
    "Internal linking",
    "Search Console",
    "Monthly analysis",
    "Reporting",
  ],
  advanced: [
    "Full SEO strategy",
    "Technical SEO",
    "Content",
    "Competitor analysis",
    "Ongoing optimisation",
    "GEO / AI Search",
    "Reporting",
    "Strategic follow-up",
  ],
};

export const ARTECIUM_KNOWLEDGE = {
  company: {
    brand: "Artecium",
    positioning:
      "Websites + AI + Automation + SEO for businesses.",
    mainMessage:
      "We build websites that help businesses get more clients — with AI, automation and SEO.",
    area: "Portugal",
    locations: ["Portugal", "Lisboa", "Almada", "Setúbal", "Margem Sul"],
  },
  websites: {
    plans: (["essential", "professional", "business"] as const).map((planKey) => {
      const plan = getCommercialPlan("websites", planKey);
      return {
        name:
          planKey === "essential"
            ? "Essential"
            : planKey === "professional"
              ? "Professional"
              : "Business",
        price: formatSetupAndMonthlyKnowledge(plan.setup, plan.monthly),
        includes: WEBSITE_INCLUDES[planKey],
      };
    }),
    notes: [
      "Final price may vary depending on complexity and required features.",
      "Many clients start with Essential and add features later.",
    ],
  },
  aiAutomation: {
    plans: (
      [
        { key: "aiSolutions", name: "AI Solutions" },
        { key: "automation", name: "Automation" },
        { key: "businessAutomation", name: "Business Automation" },
      ] as const
    ).map(({ key, name }) => {
      const plan = getCommercialPlan("aiAutomation", key);
      return {
        name,
        price: formatSetupAndMonthlyKnowledge(plan.setup, plan.monthly),
        examples: AI_EXAMPLES[key],
      };
    }),
  },
  seo: {
    plans: (
      [
        { key: "foundation", name: "SEO Foundation", note: "Initial setup" },
        { key: "growth", name: "SEO Growth" },
        { key: "advanced", name: "SEO Advanced" },
      ] as const
    ).map((entry) => {
      const { key, name } = entry;
      const note = "note" in entry ? entry.note : undefined;
      const plan = getCommercialPlan("seo", key);
      const price =
        key === "foundation"
          ? formatCommercialSetup(LOCALE, plan.setup)
          : formatCommercialMonthly(LOCALE, plan.monthly)!;
      return {
        name,
        price,
        ...(note ? { priceNote: note } : {}),
        includes: SEO_INCLUDES[key],
      };
    }),
    notes: [
      "Website plans include basic technical SEO practices.",
      "Ongoing SEO is a separate service.",
    ],
  },
  booking: {
    plans: COMMERCIAL_CATALOG.filter((p) => p.category === "booking").map(
      (plan) => ({
        name:
          plan.planKey === "starter"
            ? "Starter"
            : plan.planKey === "professional"
              ? "Professional"
              : "Business",
        price: formatSetupAndMonthlyKnowledge(plan.setup, plan.monthly),
      }),
    ),
    notes: [
      "Booking can work as a standalone product or integrated with a website.",
    ],
  },
  webApplications: {
    price: `From €${WEB_APPLICATION_SETUP_FROM_EUR.toLocaleString("en-GB")}`,
    notes: [
      "Complex projects are quoted individually.",
      "Web applications involve business logic, authentication, security and specific technical requirements.",
    ],
  },
  complementaryServices: {
    services: [
      "Custom Software",
      "Cloud Solutions",
      "Business Systems",
      "Mobile Applications",
      "Integrations",
      "APIs",
      "Automation",
      "AI",
    ],
    pricingPolicy:
      "Do not invent prices for these services when no official price is listed in this knowledge base.",
  },
  process: {
    steps: [
      {
        name: "Discovery",
        description: "Understand the business, goals and needs.",
      },
      {
        name: "Strategy",
        description: "Define structure, features, technology and priorities.",
      },
      {
        name: "Build",
        description: "Develop and test the solution.",
      },
      {
        name: "Launch and evolution",
        description: "Publish, analyse and optimise when contracted.",
      },
    ],
    timelinePolicy:
      "No fixed delivery timelines are defined in the official knowledge base. Timelines depend on project size and complexity. Artecium can review the project and provide an estimated timeline.",
    howToStart:
      "Request a quote through the website form. Artecium reviews the project and suggests the most suitable solution and investment.",
  },
  servicePages: {
    websites: "/servicos/websites",
    ai: "/servicos/ia",
    seo: "/servicos/seo",
    servicesHub: "/servicos",
  },
  restrictions: {
    doNotInvent: [
      "prices",
      "features",
      "discounts",
      "timelines",
      "clients",
      "results",
      "testimonials",
      "technologies",
      "integrations",
      "guarantees",
      "policies",
      "commercial terms",
    ],
    missingInformationResponse:
      "If the knowledge base does not contain enough information, say clearly that the information is not available in Artecium's official knowledge base and recommend contacting Artecium directly.",
  },
} as const;

export function serializeKnowledgeBase(): string {
  return JSON.stringify(ARTECIUM_KNOWLEDGE, null, 2);
}