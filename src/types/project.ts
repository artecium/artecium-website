export type ProjectType =
  | "ai-automation"
  | "website"
  | "web-application"
  | "mobile-app"
  | "custom-software"
  | "ai-chatbot";

export type BudgetRange =
  | "under-1000"
  | "1000-3000"
  | "3000-10000"
  | "10000-plus";

export type Timeline =
  | "asap"
  | "within-30-days"
  | "1-3-months"
  | "just-exploring";

export type ReferralSource =
  | "google"
  | "linkedin"
  | "instagram"
  | "referral"
  | "friend"
  | "other";

export type ContactMethod = "email" | "whatsapp";

export interface ProjectDiscoveryData {
  projectType: ProjectType | null;
  budget: BudgetRange | null;
  timeline: Timeline | null;
  referral: ReferralSource | null;
  name: string;
  company: string;
  email: string;
  description: string;
  contactMethod: ContactMethod | null;
}

export const TOTAL_STEPS = 8;

export const INITIAL_DISCOVERY_DATA: ProjectDiscoveryData = {
  projectType: null,
  budget: null,
  timeline: null,
  referral: null,
  name: "",
  company: "",
  email: "",
  description: "",
  contactMethod: null,
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  "ai-automation": "AI Automation",
  website: "Website",
  "web-application": "Web Application",
  "mobile-app": "Mobile App",
  "custom-software": "Custom Software",
  "ai-chatbot": "AI Chatbot",
};

export const BUDGET_LABELS: Record<BudgetRange, string> = {
  "under-1000": "Under €1,000",
  "1000-3000": "€1,000 – €3,000",
  "3000-10000": "€3,000 – €10,000",
  "10000-plus": "€10,000+",
};

export const TIMELINE_LABELS: Record<Timeline, string> = {
  asap: "ASAP",
  "within-30-days": "Within 30 days",
  "1-3-months": "1–3 months",
  "just-exploring": "Just exploring",
};

export const REFERRAL_LABELS: Record<ReferralSource, string> = {
  google: "Google",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  referral: "Referral",
  friend: "Friend",
  other: "Other",
};
