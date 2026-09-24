# Artecium — Security & RLS Audit

Last updated: migration `004_security_hardening.sql` (includes Part 2 extended hardening)

Run migrations in order: `001` → `002` → `003` → `004`.

---

## Access models

### CLIENT

- Data access via `company_users` → `user_company_ids()`
- **SELECT only** on financial/subscription data (no INSERT/UPDATE/DELETE)
- Documents/reports: `visibility = 'client_visible'` only
- Tickets: create/read own company; messages with author enforced by trigger
- Profiles: read/update own only (`TO authenticated`, not `public`)
- No access to: `activity_logs`, `leads`, `proposals`, `settings`, `company_payment_providers`, CRM internals

### STAFF (scoped)

- **Owner/Admin:** global access via `is_owner_or_admin()`
- **Other staff:** `staff_can_access_company(company_id)` when `staff_company_assignments` rows exist
- **Staff without assignments:** all companies (legacy 003 compatibility — assign staff before production)

Project-scoped resources use `staff_can_access_project(project_id)`.

### Service catalog

`services`, `service_features`, `service_plans`, `service_plan_features`, legacy `plans` — authenticated read (catalog). No secrets stored.

---

## Sensitive data

| Mechanism | Tables |
|-----------|--------|
| Column grants | `payment_methods`, `analytics_connections`, `seo_connections`, `integration_connections` |
| Client-safe views | `*_client` views for safe column subsets |
| Staff-only tables | `company_payment_providers`, `activity_logs`, CRM tables |
| Owner/Admin only | `settings`, `user_roles` writes, `staff_company_assignments` writes |

Staff needing secrets must use **service_role** server-side only.

---

## Profiles policy fix (004)

Migration 001 created policies without `TO authenticated`, exposing them to the `public` role. Migration 004:

- `REVOKE ALL ON profiles FROM anon, public`
- `GRANT SELECT, UPDATE ON profiles TO authenticated`
- Policies explicitly `TO authenticated`

---

## Tables protected in 004

**Part 1:** projects, tasks, milestones, documents, subscriptions, finance, analytics/SEO, tickets, activity_logs, automation_configs, staff assignments

**Part 2:** profiles, roles/permissions/user_roles, company_users, task_comments, deliverables, approvals, change_requests, messages, ticket_attachments, discounts, coupons, legacy plans/subscriptions, CRM (leads→commissions), settings, integrations catalog

---

## Inherited isolation paths

| Child | Path to company |
|-------|-----------------|
| tasks | project_id → projects.company_id |
| task_comments | task_id → tasks → projects |
| ticket_messages | ticket_id → tickets.company_id |
| ticket_attachments | ticket_message_id → tickets |
| invoice_items | invoice_id → invoices.company_id |
| subscription_entitlements | subscription_id → client_subscriptions.company_id |
| analytics_data | connection_id → analytics_connections.company_id |

---

## SECURITY DEFINER functions

| Function | Justification |
|----------|---------------|
| `is_staff_member`, `staff_can_access_*` | RLS helpers; `search_path = public` |
| `handle_new_user` | Auth signup bootstrap (001) |
| `log_subscription_change` | Subscription audit trigger (003) |
| `enforce_ticket_message_author` | Prevent author spoofing (004) |
| `enforce_profile_self_update` | Block client email/id tampering (004) |
| `set_updated_at` | Trigger; hardened search_path (004) |

`get_service_plan_features` / `get_subscription_entitlements` are **not** SECURITY DEFINER — safe.

---

## Verification

See `-- SECURITY VERIFICATION QUERIES` block at end of `004_security_hardening.sql`.

---

## Remaining risks (deliberate / future)

1. Staff without assignments = global company access
2. App-level permissions not in RLS (finance vs developer)
3. `service_role` bypasses RLS — server-side only
4. Storage bucket policies — separate from DB
5. Column grants affect all JWT users including staff browsers
