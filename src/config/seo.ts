import {
  COMPANY_EMAIL,
  COMPANY_NAME,
  COMPANY_PHONE,
  COMPANY_WEBSITE,
} from "@/config/contact";

export const SITE_URL = COMPANY_WEBSITE;
export const SITE_NAME = COMPANY_NAME;
export const SITE_TITLE =
  "Artecium — Engineering the future of business";
export const SITE_DESCRIPTION =
  "Artecium helps ambitious companies solve business problems through AI-powered software, automation, and custom digital products.";
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
  url: "/artecium-logo.png",
  width: 512,
  height: 512,
  alt: "Artecium — Premium software and AI solutions",
};

export const SITE_SERVICES = [
  "AI Automation",
  "Custom Software",
  "Web Applications",
  "Mobile Apps",
  "Cloud Solutions",
  "Business Systems",
  "AI Chatbots",
];

export const GOOGLE_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
