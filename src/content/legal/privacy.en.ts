import { LEGAL_ENTITY } from "@/config/legal-entity";
import type { LegalDocumentContent } from "@/content/legal/types";

export const privacyEn: LegalDocumentContent = {
  title: "Privacy Policy",
  description:
    "This Privacy Policy describes how Artecium processes personal data on the website, public forms, and Client Area.",
  lastUpdated: "Last updated: 25 September 2026",
  disclaimer:
    "This document is an informational draft for the Artecium website and does not constitute legal advice. Legal review is recommended before definitive use.",
  showToc: true,
  tocLabel: "Contents",
  sections: [
    {
      id: "controller",
      title: "1. Data controller",
      blocks: [
        {
          type: "p",
          text: `The ${LEGAL_ENTITY.brand} brand is used by ${LEGAL_ENTITY.providerName}, tax ID (NIF) ${LEGAL_ENTITY.nif}, with address at ${LEGAL_ENTITY.address}, economic activity code (CIRS) ${LEGAL_ENTITY.cirs}, for the provision of digital services.`,
        },
        {
          type: "p",
          text: `For privacy and data protection enquiries, contact us at ${LEGAL_ENTITY.email}.`,
        },
      ],
    },
    {
      id: "scope",
      title: "2. Scope",
      blocks: [
        {
          type: "p",
          text: "This policy applies to artecium.com, the public Project Discovery Wizard, the Client Area, the internal admin area, and related services described on this website.",
        },
        {
          type: "p",
          text: "The application of certain rules (including distance contracting, withdrawal rights, or alternative dispute resolution) may depend on the client type, contract nature, and conditions agreed on a case-by-case basis.",
        },
      ],
    },
    {
      id: "data-collected",
      title: "3. Categories of data collected",
      blocks: [
        {
          type: "p",
          text: "Depending on how you interact with our services, we may process the following categories of data:",
        },
        {
          type: "ul",
          items: [
            "Identification and contact data (name, email, phone, company).",
            "Account and authentication data (login credentials, user ID, language and currency preferences).",
            "Data submitted through the Discovery Wizard (project type, budget, timeline, referral source, description, preferred contact method).",
            "Client and project data in the Client Area (contractual information, communications, documents, tasks, meetings, and feedback).",
            "Financial data (invoices, payments, transaction references; we do not store full card details).",
            "Technical and usage data (traffic measurement and analytics, when consented).",
            "Support data (tickets, messages, and attachments).",
          ],
        },
      ],
    },
    {
      id: "discovery",
      title: "4. Discovery Wizard",
      blocks: [
        {
          type: "p",
          text: "When you use the public project discovery form, we collect the data you voluntarily provide. If you choose email contact, that data is sent via transactional email to our internal inbox through the configured email provider (Resend or, alternatively, SendGrid).",
        },
        {
          type: "p",
          text: "At this stage, data submitted through the Discovery Wizard is not automatically stored in the platform database. WhatsApp contact redirects you to the WhatsApp application (Meta), where the conversation takes place outside this website.",
        },
        {
          type: "p",
          text: "Before submission, you must confirm that you have read and accept this Privacy Policy and consent to processing your data to respond to your request.",
        },
      ],
    },
    {
      id: "client-area",
      title: "5. Client Area",
      blocks: [
        {
          type: "p",
          text: "The Client Area uses Supabase authentication. We may process profile data, associated companies, projects, services, documents, invoices, payments, notifications, meetings, aggregated analytics, aggregated SEO data, reports, support, and feedback, depending on features available to each client.",
        },
        {
          type: "p",
          text: "Access is restricted to authenticated users and subject to platform access controls.",
        },
      ],
    },
    {
      id: "purposes",
      title: "6. Purposes of processing",
      blocks: [
        {
          type: "ul",
          items: [
            "Provide, manage, and improve contracted services.",
            "Respond to contact requests and commercial opportunities.",
            "Manage client accounts, projects, billing, and payments.",
            "Communicate with clients about services, support, and deliverables.",
            "Ensure security, authentication, and technical operation of the website and platform.",
            "Measure website usage and improve experience when the user consents to analytics.",
            "Comply with applicable legal, tax, and accounting obligations.",
          ],
        },
      ],
    },
    {
      id: "legal-bases",
      title: "7. Legal bases",
      blocks: [
        {
          type: "p",
          text: "Processing of personal data may rely, depending on context, on contract performance or pre-contractual steps, compliance with legal obligations, legitimate interests, or the data subject's consent.",
        },
        {
          type: "p",
          text: "The applicable legal basis for each specific operation depends on the nature of the interaction (for example, contact request, contractual relationship, optional cookies, or support communications). When the applicable legal basis cannot be determined with certainty from the information available on this website alone, the analysis should be completed in the context of the specific contract or request.",
        },
      ],
    },
    {
      id: "processors",
      title: "8. Technology providers and subprocessors",
      blocks: [
        {
          type: "p",
          text: "To operate the website and platform, we use service providers that may process data on our behalf or as independent controllers, including:",
        },
        {
          type: "ul",
          items: [
            "Supabase — authentication, database, and file storage.",
            "Stripe — payment processing and checkout.",
            "Resend — transactional email (configurable alternative: SendGrid).",
            "Vercel — website hosting and infrastructure, where applicable.",
            "Google Analytics — traffic measurement, only after analytics consent.",
            "Microsoft Clarity — behavioural analytics, only after analytics consent.",
            "WhatsApp / Meta — when the user chooses WhatsApp contact.",
          ],
        },
        {
          type: "p",
          text: "This list reflects integrations identified in the website code. Other providers may be used for specific client projects as contractually agreed.",
        },
      ],
    },
    {
      id: "transfers",
      title: "9. International transfers",
      blocks: [
        {
          type: "p",
          text: "Some listed providers may process data outside the European Economic Area. Where this occurs, legally required safeguards will be applied, such as standard contractual clauses or other mechanisms provided under applicable law.",
        },
        {
          type: "p",
          text: "The exact processing location for each provider depends on account configuration and the service region contracted, and is not always determinable from this website alone.",
        },
      ],
    },
    {
      id: "cookies",
      title: "10. Cookies and similar technologies",
      blocks: [
        {
          type: "p",
          text: "We use cookies and similar technologies for operation, preferences, and analytics. Optional analytics cookies (Google Analytics and Microsoft Clarity) are only loaded after the user grants consent through the website cookie management system.",
        },
        {
          type: "p",
          text: "For detailed information, see our Cookie Policy.",
        },
      ],
    },
    {
      id: "rights",
      title: "11. Data subject rights",
      blocks: [
        {
          type: "p",
          text: "Under applicable law, data subjects may exercise rights of access, rectification, erasure, restriction, objection, portability, and withdrawal of consent, where applicable.",
        },
        {
          type: "p",
          text: "You may also lodge a complaint with the competent supervisory authority, including the Portuguese Data Protection Authority (CNPD), if you believe processing violates applicable law.",
        },
      ],
    },
    {
      id: "exercise",
      title: "12. How to exercise your rights",
      blocks: [
        {
          type: "p",
          text: `To exercise your rights or ask privacy questions, contact us at ${LEGAL_ENTITY.email}, stating the nature of your request and information that helps identify the relevant relationship or interaction.`,
        },
        {
          type: "p",
          text: "We will respond within applicable legal timeframes and may request additional information to verify identity when necessary.",
        },
      ],
    },
    {
      id: "security",
      title: "13. Security",
      blocks: [
        {
          type: "p",
          text: "We implement appropriate technical and organisational measures to protect personal data, including authentication, access controls, database security policies, and encrypted communications where applicable.",
        },
        {
          type: "p",
          text: "No system is completely risk-free. In the event of an incident with relevant impact on data subjects, we will take measures required under applicable law.",
        },
      ],
    },
    {
      id: "retention",
      title: "14. Data retention",
      blocks: [
        {
          type: "p",
          text: "We retain personal data only for as long as necessary to fulfil the purposes for which it was collected, including legal, tax, accounting, contractual, and dispute-resolution obligations.",
        },
        {
          type: "p",
          text: "Specific periods may vary by data category, commercial relationship, and applicable legal requirements. When no longer necessary, data will be deleted or anonymised unless legal retention is required.",
        },
      ],
    },
    {
      id: "changes",
      title: "15. Changes to this policy",
      blocks: [
        {
          type: "p",
          text: "We may update this Privacy Policy to reflect legal, technical, or operational changes. The version published on this page shows the last update date.",
        },
      ],
    },
    {
      id: "contact",
      title: "16. Contact",
      blocks: [
        {
          type: "p",
          text: `${LEGAL_ENTITY.brand} — commercial brand of ${LEGAL_ENTITY.providerName}`,
        },
        {
          type: "p",
          text: `Tax ID (NIF): ${LEGAL_ENTITY.nif}`,
        },
        {
          type: "p",
          text: `Address: ${LEGAL_ENTITY.address}`,
        },
        {
          type: "p",
          text: `Email: ${LEGAL_ENTITY.email}`,
        },
      ],
    },
  ],
};
