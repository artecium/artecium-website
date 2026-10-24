import { COOKIE_CONSENT_MAX_AGE, COOKIE_CONSENT_NAME } from "@/lib/cookies/consent";
import { LEGAL_ENTITY } from "@/config/legal-entity";
import type { LegalDocumentContent } from "@/content/legal/types";

const consentMaxAgeDays = Math.round(COOKIE_CONSENT_MAX_AGE / (60 * 60 * 24));

export const cookiesEn: LegalDocumentContent = {
  title: "Cookie Policy",
  description:
    "This Cookie Policy explains how the Artecium website uses cookies and similar technologies.",
  lastUpdated: "Last updated: 25 September 2026",
  disclaimer:
    "This document is an informational draft for the Artecium website and does not constitute legal advice.",
  showToc: true,
  tocLabel: "Contents",
  sections: [
    {
      id: "introduction",
      title: "1. What are cookies",
      blocks: [
        {
          type: "p",
          text: "Cookies are small text files stored on your device when you visit a website. They may be used to ensure site functionality, remember preferences, or measure usage.",
        },
      ],
    },
    {
      id: "consent",
      title: "2. Consent management",
      blocks: [
        {
          type: "p",
          text: "We use a cookie management system that lets you accept all optional cookies, reject optional cookies, or customise categories. Optional analytics cookies are only loaded after explicit consent to the Analytics category.",
        },
        {
          type: "p",
          text: `Your choice is stored in a first-party cookie (${COOKIE_CONSENT_NAME}) for ${consentMaxAgeDays} days, without including personally identifying information.`,
        },
      ],
    },
    {
      id: "categories",
      title: "3. Cookie categories",
      blocks: [
        {
          type: "table",
          headers: ["Category", "Purpose", "Required?"],
          rows: [
            ["Necessary", "Operation, authentication, and security", "Yes"],
            ["Preferences", "Language and experience settings", "Optional"],
            ["Analytics", "Usage measurement (GA, Clarity)", "Optional"],
            ["Marketing", "Advertising and campaigns", "Optional (no marketing cookies currently implemented)"],
          ],
        },
      ],
    },
    {
      id: "necessary",
      title: "4. Necessary cookies",
      blocks: [
        {
          type: "p",
          text: "These include authentication cookies managed by Supabase for login, session, Client Area, and admin area. Exact names, duration, and content are managed by the Supabase SSR library and are not determinable from this website's public code alone.",
        },
        {
          type: "p",
          text: "These cookies are required for authenticated areas and should not be blocked if you wish to use those features.",
        },
      ],
    },
    {
      id: "preferences",
      title: "5. Preference cookies",
      blocks: [
        {
          type: "table",
          headers: ["Name", "Provider", "Purpose", "Duration", "Type"],
          rows: [
            [
              "artecium_locale",
              "Artecium (first-party)",
              "Store language preference (pt-PT / en)",
              `${consentMaxAgeDays} days`,
              "First-party",
            ],
          ],
        },
        {
          type: "p",
          text: "The Preferences category in the consent system includes optional cookies of this type. The language cookie is used to maintain the website's multilingual experience.",
        },
      ],
    },
    {
      id: "consent-cookie",
      title: "6. Consent cookie",
      blocks: [
        {
          type: "table",
          headers: ["Name", "Provider", "Purpose", "Duration", "Type"],
          rows: [
            [
              COOKIE_CONSENT_NAME,
              "Artecium (first-party)",
              "Record consent choices (necessary, preferences, analytics, marketing)",
              `${consentMaxAgeDays} days`,
              "First-party",
            ],
          ],
        },
      ],
    },
    {
      id: "analytics",
      title: "7. Analytics cookies",
      blocks: [
        {
          type: "p",
          text: "When you accept the Analytics category, the website may load Google Analytics and Microsoft Clarity. These services may set cookies on your device.",
        },
        {
          type: "ul",
          items: [
            "Google Analytics — traffic and event measurement.",
            "Microsoft Clarity — session recordings, heatmaps, and events.",
          ],
        },
        {
          type: "p",
          text: "Exact names, duration, and content of cookies set by Google Analytics and Microsoft Clarity are not determinable from this website's code alone and may change at the providers' discretion.",
        },
      ],
    },
    {
      id: "marketing",
      title: "8. Marketing cookies",
      blocks: [
        {
          type: "p",
          text: "There are currently no marketing or advertising cookies implemented in this website's code. The Marketing category is available in the consent system for potential future use if needed.",
        },
      ],
    },
    {
      id: "third-parties",
      title: "9. Third-party cookies",
      blocks: [
        {
          type: "p",
          text: "When paying invoices, you may be redirected to Stripe checkout (stripe.com), where third-party cookies may be set by Stripe. Details depend on the interaction and are not directly controlled by this website.",
        },
        {
          type: "p",
          text: "If you choose WhatsApp contact in the Discovery Wizard, you will be redirected to WhatsApp (Meta), where cookies and data processing are governed by Meta/WhatsApp policies.",
        },
      ],
    },
    {
      id: "management",
      title: "10. How to manage cookies",
      blocks: [
        {
          type: "ul",
          items: [
            "Use the banner or «Customize» panel on the website to change preferences.",
            "You can also configure your browser to block or delete cookies.",
            "Blocking necessary cookies may affect login and authenticated features.",
          ],
        },
      ],
    },
    {
      id: "contact",
      title: "11. Contact",
      blocks: [
        {
          type: "p",
          text: `For cookie-related questions, contact ${LEGAL_ENTITY.email}.`,
        },
      ],
    },
  ],
};
