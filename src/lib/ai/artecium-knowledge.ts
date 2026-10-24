/**
 * Official Artecium knowledge base for the FAQ AI assistant.
 * Only information contained here may be used in generated answers.
 */
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
    plans: [
      {
        name: "Essential",
        price: "€750",
        includes: [
          "Up to 5 pages",
          "Custom design",
          "Responsive layout",
          "Contact form",
          "WhatsApp integration",
          "Basic technical SEO",
          "Analytics",
          "Deployment",
        ],
      },
      {
        name: "Professional",
        price: "€1,500",
        includes: [
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
      },
      {
        name: "Business",
        price: "From €2,500",
        includes: [
          "Custom website",
          "Client area / reserved area",
          "Integrations",
          "Automation",
          "AI",
          "Booking systems",
          "APIs",
          "Custom functionality",
        ],
      },
    ],
    notes: [
      "Final price may vary depending on complexity and required features.",
      "Many clients start with Essential and add features later.",
    ],
  },
  aiAutomation: {
    plans: [
      {
        name: "AI Solutions",
        price: "From €750",
        examples: [
          "Chatbots",
          "AI assistants",
          "Smart forms",
          "Content generation",
          "Lead qualification",
        ],
      },
      {
        name: "Automation",
        price: "From €1,500",
        examples: [
          "CRM",
          "Workflows",
          "Integrations",
          "APIs",
          "Automated emails",
          "Data processing",
        ],
      },
      {
        name: "Business Automation",
        price: "Custom project",
        examples: [
          "AI agents",
          "Internal systems",
          "Complex integrations",
          "Advanced automation",
        ],
      },
    ],
  },
  seo: {
    plans: [
      {
        name: "SEO Foundation",
        price: "€350",
        priceNote: "Initial setup",
        includes: [
          "SEO audit",
          "Technical SEO",
          "Metadata",
          "Heading structure",
          "Sitemap",
          "Search Console",
          "Indexing",
          "Base schema",
        ],
      },
      {
        name: "SEO Growth",
        price: "€500/month",
        includes: [
          "Ongoing optimisation",
          "Keyword research",
          "Content",
          "Internal linking",
          "Search Console",
          "Monthly analysis",
          "Reporting",
        ],
      },
      {
        name: "SEO Advanced",
        price: "€900/month",
        includes: [
          "Full SEO strategy",
          "Technical SEO",
          "Content",
          "Competitor analysis",
          "Ongoing optimisation",
          "GEO / AI Search",
          "Reporting",
          "Strategic follow-up",
        ],
      },
    ],
    notes: [
      "Website plans include basic technical SEO practices.",
      "Ongoing SEO is a separate service.",
    ],
  },
  webApplications: {
    price: "From €3,500",
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
