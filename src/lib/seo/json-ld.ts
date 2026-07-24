import {
  SITE_CONTACT,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SERVICES,
  SITE_URL,
} from "@/config/seo";

export function getOrganizationSchema() {
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
    description: SITE_DESCRIPTION,
    email: SITE_CONTACT.email,
    telephone: SITE_CONTACT.phoneFormatted,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: SITE_CONTACT.email,
      telephone: SITE_CONTACT.phoneFormatted,
      availableLanguage: ["English", "Portuguese"],
    },
  };
}

export function getProfessionalServiceSchema() {
  return {
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#professional-service`,
    name: SITE_NAME,
    url: SITE_URL,
    image: `${SITE_URL}/artecium-logo.png`,
    description: SITE_DESCRIPTION,
    provider: {
      "@id": `${SITE_URL}/#organization`,
    },
    areaServed: {
      "@type": "Place",
      name: "Worldwide",
    },
    serviceType: SITE_SERVICES,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Software & Technology Services",
      itemListElement: SITE_SERVICES.map((service, index) => ({
        "@type": "Offer",
        position: index + 1,
        itemOffered: {
          "@type": "Service",
          name: service,
          provider: {
            "@id": `${SITE_URL}/#organization`,
          },
        },
      })),
    },
  };
}

export function getWebSiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    inLanguage: "en-US",
  };
}

export function getWebPageSchema() {
  return {
    "@type": "WebPage",
    "@id": `${SITE_URL}/#webpage`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },
    about: {
      "@id": `${SITE_URL}/#organization`,
    },
    inLanguage: "en-US",
  };
}

export function getStructuredDataGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      getOrganizationSchema(),
      getProfessionalServiceSchema(),
      getWebSiteSchema(),
      getWebPageSchema(),
    ],
  };
}
