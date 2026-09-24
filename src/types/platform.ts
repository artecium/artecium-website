/** Platform-wide enums and domain types for Artecium. */

export const USER_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  PROJECT_MANAGER: "project_manager",
  DEVELOPER: "developer",
  DESIGNER: "designer",
  SEO: "seo",
  ANALYTICS: "analytics",
  SUPPORT: "support",
  FINANCE: "finance",
  CLIENT: "client",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const STAFF_ROLES: UserRole[] = [
  USER_ROLES.OWNER,
  USER_ROLES.ADMIN,
  USER_ROLES.PROJECT_MANAGER,
  USER_ROLES.DEVELOPER,
  USER_ROLES.DESIGNER,
  USER_ROLES.SEO,
  USER_ROLES.ANALYTICS,
  USER_ROLES.SUPPORT,
  USER_ROLES.FINANCE,
];

export const PERMISSIONS = {
  CLIENTS_VIEW: "clients.view",
  CLIENTS_EDIT: "clients.edit",
  PROJECTS_VIEW: "projects.view",
  PROJECTS_EDIT: "projects.edit",
  PROJECTS_ASSIGN: "projects.assign",
  PAYMENTS_VIEW: "payments.view",
  PAYMENTS_EDIT: "payments.edit",
  INVOICES_VIEW: "invoices.view",
  INVOICES_EDIT: "invoices.edit",
  ANALYTICS_VIEW: "analytics.view",
  SEO_VIEW: "seo.view",
  SUPPORT_VIEW: "support.view",
  SUPPORT_RESPOND: "support.respond",
  USERS_MANAGE: "users.manage",
  SETTINGS_MANAGE: "settings.manage",
  LEADS_VIEW: "leads.view",
  LEADS_EDIT: "leads.edit",
  PROPOSALS_VIEW: "proposals.view",
  PROPOSALS_EDIT: "proposals.edit",
  CONTRACTS_VIEW: "contracts.view",
  CONTRACTS_EDIT: "contracts.edit",
  REPORTS_VIEW: "reports.view",
  DOCUMENTS_VIEW: "documents.view",
  DOCUMENTS_EDIT: "documents.edit",
  INTEGRATIONS_MANAGE: "integrations.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "in_review",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const TICKET_STATUSES = [
  "new",
  "in_review",
  "in_progress",
  "awaiting_client",
  "resolved",
  "closed",
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const INVOICE_STATUSES = [
  "draft",
  "issued",
  "sent",
  "viewed",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
  "refunded",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PROPOSAL_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "accepted",
  "rejected",
  "expired",
] as const;

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const CHANGE_REQUEST_STATUSES = [
  "new",
  "in_review",
  "approved",
  "in_development",
  "completed",
  "rejected",
] as const;

export type ChangeRequestStatus = (typeof CHANGE_REQUEST_STATUSES)[number];

export const DELIVERABLE_TYPES = [
  "design",
  "website",
  "logo",
  "software",
  "automation",
  "seo_report",
  "analytics_report",
  "documentation",
] as const;

export type DeliverableType = (typeof DELIVERABLE_TYPES)[number];

export const SERVICE_CATEGORIES = [
  "web",
  "software",
  "ai",
  "seo",
  "analytics",
  "data",
  "infrastructure",
  "integrations",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const SUPPORTED_LOCALES = ["pt", "en", "es", "fr"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const SUPPORTED_CURRENCIES = ["EUR", "GBP", "USD"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export interface PlatformProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  locale: SupportedLocale;
  currency: SupportedCurrency;
  roles: UserRole[];
  permissions: Permission[];
  company_ids: string[];
}

export interface ProjectStatusConfig {
  id: string;
  slug: string;
  label: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

export interface EmptyDataState {
  configured: boolean;
  message: string;
}

// ---------------------------------------------------------------------------
// Services, plans & subscriptions
// ---------------------------------------------------------------------------

export const SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "paused",
  "cancelled",
  "expired",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const BILLING_PERIODS = [
  "monthly",
  "quarterly",
  "yearly",
  "one_time",
] as const;

export type BillingPeriod = (typeof BILLING_PERIODS)[number];

export type FeatureValueType = "boolean" | "numeric" | "text";

export interface Service {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  has_plans: boolean;
  billing_model: "subscription" | "one_time" | "custom";
  is_active: boolean;
  sort_order: number;
}

export interface ServiceFeature {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  value_type: FeatureValueType;
  default_unit: string | null;
  category: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ServicePlan {
  id: string;
  service_id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: SupportedCurrency;
  billing_period: BillingPeriod;
  parent_plan_id: string | null;
  is_active: boolean;
  sort_order: number;
}

/** Direct feature assignment on a plan (resolved with inheritance server-side). */
export interface PlanFeature {
  id: string;
  service_plan_id: string;
  feature_id: string;
  is_enabled: boolean;
  limit_value: number | null;
  limit_unit: string | null;
  sort_order: number;
  feature?: ServiceFeature;
}

export interface ClientSubscription {
  id: string;
  company_id: string;
  service_id: string;
  service_plan_id: string | null;
  status: SubscriptionStatus;
  price: number | null;
  currency: SupportedCurrency;
  billing_period: BillingPeriod;
  started_at: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  config: Record<string, unknown>;
  service?: Service;
  plan?: ServicePlan;
}

export interface SubscriptionEntitlement {
  feature_id: string;
  feature_slug: string;
  feature_name: string;
  value_type: FeatureValueType;
  is_enabled: boolean;
  limit_value: number | null;
  limit_unit: string | null;
  source: "plan" | "override" | "addon";
}

export interface UsageRecord {
  id: string;
  subscription_id: string;
  feature_id: string;
  company_id: string;
  project_id: string | null;
  period_start: string;
  period_end: string;
  quantity_used: number;
  unit: string;
  description: string | null;
  created_at: string;
}

export interface UsageSummary {
  feature_slug: string;
  feature_name: string;
  unit: string;
  limit: number | null;
  used: number;
  remaining: number | null;
  period_start: string;
  period_end: string;
}

export interface ClientServiceOverview {
  subscription: ClientSubscription;
  entitlements: SubscriptionEntitlement[];
  usage: UsageSummary[];
}

export interface ProjectStatusHistory {
  id: string;
  project_id: string;
  from_status_id: string | null;
  to_status_id: string | null;
  changed_by: string | null;
  note: string | null;
  created_at: string;
  from_status?: ProjectStatusConfig | null;
  to_status?: ProjectStatusConfig | null;
}

// ---------------------------------------------------------------------------
// Finance (payments & invoicing)
// ---------------------------------------------------------------------------

export const PAYMENT_STATUSES = [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
  "refunded",
  "partially_refunded",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHOD_TYPES = [
  "card",
  "apple_pay",
  "google_pay",
  "mb_way",
  "bank_transfer",
  "sepa",
  "other",
] as const;

export type PaymentMethodType = (typeof PAYMENT_METHOD_TYPES)[number];

export interface PaymentMethod {
  id: string;
  company_id: string;
  provider: string;
  provider_reference: string | null;
  provider_customer_id: string | null;
  method_type: PaymentMethodType | string;
  last4: string | null;
  brand: string | null;
  is_default: boolean;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  company_id: string;
  invoice_id: string | null;
  subscription_id: string | null;
  payment_method_id: string | null;
  amount: number;
  currency: SupportedCurrency;
  status: PaymentStatus | string;
  provider: string | null;
  provider_payment_id: string | null;
  provider_payment_intent_id: string | null;
  transaction_reference: string | null;
  refunded_amount: number;
  failure_code: string | null;
  failure_message: string | null;
  metadata: Record<string, unknown>;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentStatusHistory {
  id: string;
  payment_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Invoice {
  id: string;
  company_id: string;
  subscription_id: string | null;
  invoice_number: string | null;
  status: InvoiceStatus | string;
  issue_date: string | null;
  due_date: string | null;
  paid_at: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  subtotal: number | null;
  discount: number;
  tax: number | null;
  total: number | null;
  amount_paid: number;
  currency: SupportedCurrency;
  provider_invoice_id: string | null;
  notes: string | null;
  pdf_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceStatusHistory {
  id: string;
  invoice_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CompanyPaymentProvider {
  id: string;
  company_id: string;
  provider: string;
  provider_customer_id: string;
  is_default: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Subscription history
// ---------------------------------------------------------------------------

export const SUBSCRIPTION_EVENT_TYPES = [
  "created",
  "plan_changed",
  "status_changed",
  "cancelled",
  "reactivated",
  "paused",
  "resumed",
  "expired",
] as const;

export type SubscriptionEventType = (typeof SUBSCRIPTION_EVENT_TYPES)[number];

export interface SubscriptionHistory {
  id: string;
  subscription_id: string;
  company_id: string;
  event_type: SubscriptionEventType;
  from_plan_id: string | null;
  to_plan_id: string | null;
  from_status: string | null;
  to_status: string | null;
  reason: string | null;
  changed_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Projects (extended)
// ---------------------------------------------------------------------------

export const PROJECT_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number];

export const MILESTONE_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "review",
  "done",
  "cancelled",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const MEETING_STATUSES = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
] as const;

export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
  responsible_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  milestone_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: ProjectPriority;
  assignee_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Support (extended)
// ---------------------------------------------------------------------------

export const SUPPORT_CHANNELS = [
  "email",
  "whatsapp",
  "phone",
  "portal",
] as const;

export type SupportChannel = (typeof SUPPORT_CHANNELS)[number];

export interface SupportTicket {
  id: string;
  company_id: string;
  project_id: string | null;
  service_id: string | null;
  subscription_id: string | null;
  subject: string;
  category: string | null;
  priority: string;
  status: TicketStatus | string;
  channel: SupportChannel | null;
  sla_response_target_minutes: number | null;
  assignee_id: string | null;
  created_by: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Contacts & staff assignments
// ---------------------------------------------------------------------------

export const CONTACT_ROLES = [
  "owner",
  "billing",
  "technical",
  "general",
] as const;

export type ContactRole = (typeof CONTACT_ROLES)[number];

export interface StaffCompanyAssignment {
  user_id: string;
  company_id: string;
  role_hint: string | null;
  assigned_by: string | null;
  assigned_at: string;
}

// ---------------------------------------------------------------------------
// Documents (extended)
// ---------------------------------------------------------------------------

export const DOCUMENT_VISIBILITY = [
  "client_visible",
  "internal_only",
] as const;

export type DocumentVisibility = (typeof DOCUMENT_VISIBILITY)[number];

export const DOCUMENT_TYPES = [
  "contract",
  "invoice",
  "proposal",
  "report",
  "technical",
  "client_upload",
  "internal",
  "other",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface PlatformDocument {
  id: string;
  company_id: string | null;
  project_id: string | null;
  subscription_id: string | null;
  category: string;
  document_type: string | null;
  title: string;
  visibility: DocumentVisibility;
  file_path: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ---------------------------------------------------------------------------
// Analytics & SEO connections (extended)
// ---------------------------------------------------------------------------

export interface AnalyticsConnection {
  id: string;
  company_id: string;
  project_id: string | null;
  provider: string;
  account_id: string | null;
  property_id: string | null;
  display_name: string | null;
  status: string;
  connected_at: string | null;
  last_sync_at: string | null;
  secret_reference: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SeoConnection {
  id: string;
  company_id: string;
  project_id: string | null;
  provider: string;
  site_url: string | null;
  property_identifier: string | null;
  display_name: string | null;
  status: string;
  connected_at: string | null;
  last_sync_at: string | null;
  secret_reference: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Notifications & preferences
// ---------------------------------------------------------------------------

export const NOTIFICATION_CATEGORIES = [
  "project_updates",
  "payments",
  "invoices",
  "support",
  "reports",
  "meetings",
  "system",
  "marketing",
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_CHANNELS = [
  "email",
  "in_app",
  "sms",
  "whatsapp",
] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export interface NotificationPreference {
  user_id: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  is_enabled: boolean;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Audit & automation
// ---------------------------------------------------------------------------

export interface ActivityLog {
  id: string;
  actor_id: string | null;
  company_id: string | null;
  project_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AutomationConfig {
  id: string;
  company_id: string | null;
  project_id: string | null;
  service_id: string | null;
  slug: string;
  name: string;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Infrastructure (domains & hosting)
// ---------------------------------------------------------------------------

export interface DomainRecord {
  id: string;
  company_id: string;
  project_id: string | null;
  domain: string;
  registrar: string | null;
  expires_at: string | null;
  auto_renew: boolean;
  dns_status: string | null;
  ssl_status: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface HostingRecord {
  id: string;
  company_id: string;
  project_id: string | null;
  provider: string | null;
  plan_name: string | null;
  environment: string | null;
  uptime_percent: number | null;
  status: string;
  renews_at: string | null;
  created_at: string;
  updated_at: string;
}
