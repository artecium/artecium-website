import { LEGAL_ENTITY } from "@/config/legal-entity";
import {
  SITE_CONTACT,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SERVICES,
  SITE_URL,
} from "@/config/seo";

const AREA_SERVED = [
  { "@type": "Country", name: "Portugal" },
  { "@type": "City", name: "Lisboa" },
  { "@type": "City", name: "Almada" },
  { "@type": "City", name: "Setúbal" },
  { "@type": "AdministrativeArea", name: "Margem Sul" },
] as const;

interface StructuredDataOptions {
  description?: string;
  inLanguage?: string;
  services?: string[];
  path?: string;
  name?: string;
}

export function getOrganizationSchema({
  description = SITE_DESCRIPTION,
}: StructuredDataOptions = {}) {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/artecium-logo.png`,
      width: 512,
      height: 512,
    },
    image: `${SITE_URL}/artecium-logo.png`,
    description,
    email: SITE_CONTACT.email,
    telephone: SITE_CONTACT.phoneFormatted,
    founder: {
      "@type": "Person",
      name: LEGAL_ENTITY.providerName,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: SITE_CONTACT.email,
      telephone: SITE_CONTACT.phoneFormatted,
      availableLanguage: ["English", "Portuguese"],
      areaServed: "PT",
    },
  };
}

export function getProfessionalServiceSchema({
  description = SITE_DESCRIPTION,
  services = SITE_SERVICES,
}: StructuredDataOptions = {}) {
  return {
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#professional-service`,
    name: SITE_NAME,
    url: SITE_URL,
    image: `${SITE_URL}/artecium-logo.png`,
    description,
    provider: {
      "@id": `${SITE_URL}/#organization`,
    },
    areaServed: AREA_SERVED,
    serviceType: services,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Digital Services for Businesses",
      itemListElement: services.map((service, index) => ({
        "@type": "Offer",
        position: index + 1,
        itemOffered: {
          "@type": "Service",
          name: service,
          provider: {
            "@id": `${SITE_URL}/#organization`,
          },
          areaServed: AREA_SERVED,
        },
      })),
    },
  };
}

export function getWebSiteSchema({
  description = SITE_DESCRIPTION,
  inLanguage = "pt-PT",
}: StructuredDataOptions = {}) {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description,
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    inLanguage,
  };
}

export function getWebPageSchema({
  description = SITE_DESCRIPTION,
  inLanguage = "pt-PT",
  path = "/",
  name = SITE_NAME,
}: StructuredDataOptions = {}) {
  const pageUrl = path === "/" ? SITE_URL : `${SITE_URL}${path}`;

  return {
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name,
    description,
    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },
    about: {
      "@id": `${SITE_URL}/#organization`,
    },
    inLanguage,
  };
}

export function getStructuredDataGraph(options: StructuredDataOptions = {}) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      getOrganizationSchema(options),
      getProfessionalServiceSchema(options),
      getWebSiteSchema(options),
    ],
  };
}
