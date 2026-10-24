import {
  COMPANY_EMAIL,
  COMPANY_NAME,
  COMPANY_PHONE,
  COMPANY_WEBSITE,
} from "@/config/contact";

export const SITE_URL = COMPANY_WEBSITE;
export const SITE_NAME = COMPANY_NAME;
export const SITE_TITLE =
  "Websites, AI, Automation & SEO for Businesses | Artecium";
export const SITE_DESCRIPTION =
  "We create professional websites with AI, automation and SEO for businesses in Portugal — helping companies attract customers, streamline processes and grow online.";
export const SITE_TAGLINE = "Engineering the future of business";
export const SITE_KEYWORDS = [
  "software development",
  "AI automation",
  "custom software",
  "web applications",
  "mobile apps",
  "digital transformation",
  "business technology",
  "Portugal software company",
  "enterprise software",
  "AI solutions",
];

export const SITE_LOCALE = "en_US";
export const SITE_TWITTER_HANDLE = "@artecium";

export const SITE_CONTACT = {
  email: COMPANY_EMAIL,
  phone: COMPANY_PHONE,
  phoneFormatted: `+${COMPANY_PHONE}`,
};

export const SITE_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Artecium — Websites, AI, Automation & SEO for Businesses",
};

export const SITE_SERVICES = [
  "Websites",
  "AI & Automation",
  "SEO",
  "Web Applications",
  "Custom Software",
  "Cloud Solutions",
  "Business Systems",
  "Mobile Apps",
];

export const GOOGLE_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
