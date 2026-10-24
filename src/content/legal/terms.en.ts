import { LEGAL_ENTITY } from "@/config/legal-entity";
import type { LegalDocumentContent } from "@/content/legal/types";

export const termsEn: LegalDocumentContent = {
  title: "Terms & Conditions",
  description:
    "These Terms & Conditions govern use of the Artecium website and the provision of digital services under the Artecium brand.",
  lastUpdated: "Last updated: 25 September 2026",
  disclaimer:
    "This document is an informational draft for the Artecium website and does not constitute legal advice. Legal review is recommended before definitive use.",
  showToc: true,
  tocLabel: "Contents",
  sections: [
    {
      id: "identification",
      title: "1. Service provider identification",
      blocks: [
        {
          type: "p",
          text: `${LEGAL_ENTITY.brand} is a commercial brand used by ${LEGAL_ENTITY.providerName}, tax ID (NIF) ${LEGAL_ENTITY.nif}, with address at ${LEGAL_ENTITY.address}, economic activity code (CIRS) ${LEGAL_ENTITY.cirs}.`,
        },
        {
          type: "p",
          text: `Contact: ${LEGAL_ENTITY.email}. Artecium is not an independent commercial company for the purposes of these Terms; services are provided by the identified provider above.`,
        },
      ],
    },
    {
      id: "relationship-nature",
      title: "2. Nature of the contractual relationship",
      blocks: [
        {
          type: "p",
          text: "The relationship between the provider and the client depends on the legal qualification of the contract and the specific context of each service.",
        },
        {
          type: "p",
          text: "Where the client contracts in the course of their professional, commercial, or business activity, the relationship will generally be business-to-business (B2B) in nature.",
        },
        {
          type: "p",
          text: "Where the client acts as a consumer under applicable law, mandatory consumer protection rules that are legally required will apply, including, where relevant, rules on distance contracting, pre-contractual information, withdrawal rights, and alternative dispute resolution.",
        },
        {
          type: "p",
          text: "The specific conditions in the applicable proposal, quote, contract, or service order may supplement these Terms. In case of conflict, the specific agreed conditions prevail over these general Terms, without prejudice to applicable mandatory legal rules.",
        },
      ],
    },
    {
      id: "object",
      title: "3. Scope of services",
      blocks: [
        {
          type: "p",
          text: "Artecium provides software engineering, digital products, automation, artificial intelligence, SEO, digital marketing, and related services as described on the website and agreed with each client.",
        },
      ],
    },
    {
      id: "websites",
      title: "4. Websites and applications",
      blocks: [
        {
          type: "p",
          text: "We may design, develop, implement, and maintain websites, web applications, mobile applications, and digital platforms. Scope, technologies, timelines, and deliverables are defined in the applicable proposal or contract.",
        },
      ],
    },
    {
      id: "development",
      title: "5. Development and implementation",
      blocks: [
        {
          type: "p",
          text: "Development services may include, as agreed, analysis, design, implementation, testing, documentation, and training. Scope changes may require revision of timelines and commercial terms.",
        },
      ],
    },
    {
      id: "seo-marketing",
      title: "6. SEO and digital marketing",
      blocks: [
        {
          type: "p",
          text: "SEO, analytics, digital campaigns, and online presence services are provided as agreed. Results may vary depending on market, competition, third-party platforms, and external factors outside our direct control.",
        },
      ],
    },
    {
      id: "ai-automation",
      title: "7. Artificial intelligence and automation",
      blocks: [
        {
          type: "p",
          text: "AI and automation solutions may integrate third-party services (APIs, models, cloud platforms). The client is responsible for using these solutions in compliance with applicable law and third-party provider terms.",
        },
        {
          type: "p",
          text: "AI systems may produce incorrect, incomplete, or unsuitable outputs. Where applicable, the client should validate outputs before using them in decisions, content, communications, or relevant processes.",
        },
        {
          type: "p",
          text: "Third-party tools, models, and platforms may have their own conditions, limitations, usage policies, and compliance requirements. The specific scope of AI use in each project will be defined in the proposal or contract where relevant.",
        },
      ],
    },
    {
      id: "quotes",
      title: "8. Quotes and proposals",
      blocks: [
        {
          type: "p",
          text: "Quotes and commercial proposals are valid for the period stated in each document. Unless expressly agreed, they are not binding until formally accepted by the client.",
        },
        {
          type: "p",
          text: "The specific conditions set out in the applicable proposal, quote, contract, or service order prevail over these Terms in case of conflict, without prejudice to mandatory legal rules.",
        },
      ],
    },
    {
      id: "payments",
      title: "9. Payments, cancellations, and refunds",
      blocks: [
        {
          type: "p",
          text: "Payments are processed according to agreed conditions. Payment terms, milestones, amounts, subscriptions, and any recurring payments are defined in the applicable proposal or contract.",
        },
        {
          type: "p",
          text: "Online payments may be processed through Stripe. The client must provide accurate billing information.",
        },
        {
          type: "p",
          text: "Any cancellations, suspension for non-payment, penalties, or refunds depend on the applicable contract and legally required rules. Consumer rights that cannot legally be excluded remain protected.",
        },
      ],
    },
    {
      id: "withdrawal",
      title: "10. Right of withdrawal",
      blocks: [
        {
          type: "p",
          text: "Where the client is a consumer and the contract falls within the legal regime applicable to distance contracts or off-premises contracts, a legal right of withdrawal may exist under applicable law and within the periods provided by law.",
        },
        {
          type: "p",
          text: "The exercise of that right, as well as any exceptions, depends on the nature of the contract, the type of service, and the specific circumstances of each transaction.",
        },
        {
          type: "p",
          text: "Where performance of services begins before the end of the legal withdrawal period at the consumer's request, the applicable legal requirements regarding commencement of performance, prior information, and any proportional payment, where required, will be observed.",
        },
        {
          type: "p",
          text: "Some situations may be subject to legal exceptions to the right of withdrawal. Mandatory consumer rights prevail over any provision of these Terms that conflicts with them.",
        },
        {
          type: "p",
          text: "Where legally applicable, the consumer will be provided with the legally required pre-contractual information and the applicable withdrawal form.",
        },
      ],
    },
    {
      id: "timelines",
      title: "11. Timelines",
      blocks: [
        {
          type: "p",
          text: "Indicated timelines are estimates based on agreed scope and client collaboration. Delays caused by lack of feedback, incomplete materials, third-party dependencies, or scope changes may affect schedules.",
        },
      ],
    },
    {
      id: "client-obligations",
      title: "12. Client obligations",
      blocks: [
        {
          type: "ul",
          items: [
            "Provide complete, accurate, and timely information.",
            "Designate decision-makers when required.",
            "Review deliverables within agreed timeframes.",
            "Ensure rights to provided materials.",
            "Meet payment obligations.",
          ],
        },
      ],
    },
    {
      id: "client-content",
      title: "13. Client-provided content and materials",
      blocks: [
        {
          type: "p",
          text: "The client warrants that they hold the necessary rights to texts, images, brands, data, and other materials provided, and that these do not infringe third-party rights or applicable law.",
        },
      ],
    },
    {
      id: "ip",
      title: "14. Intellectual property",
      blocks: [
        {
          type: "p",
          text: "For the purposes of these Terms, the following are distinguished, as applicable:",
        },
        {
          type: "ul",
          items: [
            "Deliverables developed specifically for the client within the agreed project.",
            "Pre-existing or reusable components, libraries, templates, code, methodologies, frameworks, and know-how of Artecium.",
            "Open-source software integrated into projects.",
            "Third-party SaaS services, APIs, platforms, and tools.",
          ],
        },
        {
          type: "p",
          text: "Ownership or licence of specific deliverables developed for the client will be defined in the applicable proposal or contract. Full payment of amounts due may be a condition for final transfer or licence, where expressly agreed.",
        },
        {
          type: "p",
          text: "Pre-existing, reusable, or generic Artecium components remain the provider's property, and the client may be granted the licence necessary to use the final deliverables, on the terms defined in the proposal or contract, unless otherwise agreed in writing.",
        },
        {
          type: "p",
          text: "Open-source software remains subject to applicable open-source licences. Third-party SaaS, APIs, and platforms remain subject to the conditions, licences, and policies of their respective providers.",
        },
        {
          type: "p",
          text: "The Artecium brand, visual identity, proprietary methodologies, and pre-existing know-how are not transferred to the client unless expressly licensed.",
        },
      ],
    },
    {
      id: "third-party-licences",
      title: "15. Third-party software and service licences",
      blocks: [
        {
          type: "p",
          text: "Projects may depend on open-source software, SaaS, APIs, and cloud services subject to their own licences. The client is responsible for agreed recurring third-party costs (hosting, domains, tools, APIs) unless otherwise stated.",
        },
      ],
    },
    {
      id: "domains",
      title: "16. Domains and hosting",
      blocks: [
        {
          type: "p",
          text: "Domain registration, DNS, hosting, SSL certificates, and infrastructure may be managed by Artecium or the client, as agreed. Ownership of domains and accounts must be defined contractually.",
        },
      ],
    },
    {
      id: "maintenance",
      title: "17. Maintenance and support",
      blocks: [
        {
          type: "p",
          text: "Maintenance, support, and continuous evolution services, including SLAs or response times, apply only when expressly contracted. Outside that scope, support is provided on a reasonable commercial basis.",
        },
      ],
    },
    {
      id: "changes",
      title: "18. Changes and additional requests",
      blocks: [
        {
          type: "p",
          text: "Additional requests, scope changes, or new features may require separate quoting and agreement. Extra work not included in the original scope may be billed according to agreed conditions.",
        },
      ],
    },
    {
      id: "liability",
      title: "19. Limitation of liability",
      blocks: [
        {
          type: "p",
          text: "Any limitation or exclusion of liability set out in these Terms applies only to the extent permitted by applicable law and does not affect rights or liabilities that cannot legally be excluded or limited.",
        },
        {
          type: "p",
          text: "To the extent legally permitted, the provider's liability for indirect damages, lost profits, data loss, or business interruption may be limited as contractually agreed.",
        },
        {
          type: "p",
          text: "We do not guarantee specific commercial results, permanent SEO rankings, uninterrupted third-party service availability, or complete absence of technical vulnerabilities. Digital systems may be subject to technical risks, platform changes, outages, or limitations of external services.",
        },
      ],
    },
    {
      id: "third-parties",
      title: "20. Third-party services",
      blocks: [
        {
          type: "p",
          text: "Integrations with Stripe, Supabase, email providers, analytics, cloud platforms, social networks, and other tools are subject to those providers' terms and availability. We are not responsible for third-party changes, outages, or policies, to the extent legally permitted.",
        },
      ],
    },
    {
      id: "termination",
      title: "21. Suspension and termination",
      blocks: [
        {
          type: "p",
          text: "We may suspend or terminate services in cases of material breach, non-payment, abusive use, or legal requirement, with notice when reasonably possible. Specific termination and post-termination conditions are set out in the applicable contract.",
        },
      ],
    },
    {
      id: "confidentiality",
      title: "22. Confidentiality",
      blocks: [
        {
          type: "p",
          text: "Each party undertakes to protect the other's confidential information, except where disclosure is required by law or necessary to perform the service (including subprocessors bound by confidentiality duties).",
        },
      ],
    },
    {
      id: "data-protection",
      title: "23. Data protection",
      blocks: [
        {
          type: "p",
          text: "Personal data processing is governed by the Privacy Policy. Where applicable, data processing agreements or specific clauses will be defined contractually depending on each party's role.",
        },
      ],
    },
    {
      id: "law",
      title: "24. Governing law",
      blocks: [
        {
          type: "p",
          text: "These Terms are governed by Portuguese law, without prejudice to mandatory rules applicable to consumers or cross-border relationships, where relevant.",
        },
      ],
    },
    {
      id: "disputes",
      title: "25. Dispute resolution",
      blocks: [
        {
          type: "p",
          text: "In case of dispute, the parties will first seek an amicable solution.",
        },
        {
          type: "p",
          text: "Where legally applicable, consumers may use alternative dispute resolution (ADR) mechanisms or competent courts according to their legal status.",
        },
        {
          type: "p",
          text: "Where the client is a consumer, applicable legal information obligations regarding alternative dispute resolution will be respected for the specific relationship. The competent ADR entity depends on the activity and legally applicable circumstances.",
        },
        {
          type: "p",
          text: "Territorial jurisdiction and applicable mechanisms depend on the nature of the relationship (B2B or B2C) and specific contractual conditions.",
        },
      ],
    },
    {
      id: "contact",
      title: "26. Contact",
      blocks: [
        {
          type: "p",
          text: `${LEGAL_ENTITY.brand} — commercial brand of ${LEGAL_ENTITY.providerName}`,
        },
        {
          type: "p",
          text: `Tax ID (NIF): ${LEGAL_ENTITY.nif} · ${LEGAL_ENTITY.address} · ${LEGAL_ENTITY.email}`,
        },
      ],
    },
  ],
};
