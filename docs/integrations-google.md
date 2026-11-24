# Google Analytics 4 & Search Console — OAuth setup

This document covers **OAuth and connection management** for the Artecium platform. Metric sync is documented separately when enabled.

## Google Cloud Console

1. Create a project (e.g. `artecium-integrations`).
2. Enable APIs:
   - **Google Analytics Data API**
   - **Google Analytics Admin API** (list GA4 properties after OAuth)
   - **Google Search Console API**
3. Configure **OAuth consent screen** (type **External** for client Google accounts).
   - Add scopes:
     - `https://www.googleapis.com/auth/analytics.readonly`
     - `https://www.googleapis.com/auth/webmasters.readonly`
   - Add test users while the app is in **Testing**.
4. Create **OAuth 2.0 Client ID** → **Web application**.
5. Register **Authorized redirect URIs** (must match `NEXT_PUBLIC_APP_URL`):

   | Environment | Analytics callback | Search Console callback |
   |-------------|-------------------|------------------------|
   | Local | `http://localhost:3000/api/integrations/google/callback/analytics` | `http://localhost:3000/api/integrations/google/callback/seo` |
   | Production | `https://<your-app-host>/api/integrations/google/callback/analytics` | `https://<your-app-host>/api/integrations/google/callback/seo` |

   OAuth **starts** from `/api/integrations/google/start/analytics` and `/api/integrations/google/start/seo` (staff session required).

## Environment variables

Set these in your hosting provider (never commit values):

| Variable | Purpose |
|----------|---------|
| `GOOGLE_OAUTH_CLIENT_ID` | OAuth Web client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | OAuth Web client secret |
| `GOOGLE_OAUTH_STATE_SECRET` | HMAC secret for signed `state` (long random string) |
| `GOOGLE_SYNC_CRON_SECRET` | Reserved for future scheduled sync routes (optional until sync ships) |
| `NEXT_PUBLIC_APP_URL` | Public base URL used for OAuth redirects (e.g. `https://artecium.com`) |

Existing Supabase variables (`SUPABASE_SERVICE_ROLE_KEY`, etc.) are required for token storage.

## Database

Apply migration `018_google_oauth_tokens.sql`:

- `google_oauth_tokens` — refresh/access tokens (service role only).
- `google_oauth_authorization_states` — single-use OAuth CSRF states.
- Unique indexes on `(connection_id, metric_date)` for `analytics_data` and `seo_data`.

Ensure `scripts/grant-service-role-admin.sql` grants are applied for the new tables.

## Back Office flow (pilot)

1. Sign in as staff with **Analytics** or **SEO** permission.
2. Open `/admin/analytics` or `/admin/seo`.
3. Choose a client company → **Connect**.
4. Complete Google consent with an account that has access to the client’s GA4 property / GSC site.
5. Select the property or site and **Activate**.
6. Demo connections for that company are **archived** when a real property/site is activated.

## Pilot testing checklist

- [ ] Migration applied to Supabase.
- [ ] Env vars set on local or preview.
- [ ] Test user added on OAuth consent screen.
- [ ] Google account has Viewer access to target GA4 property and GSC property.
- [ ] Run OAuth end-to-end; confirm connection status `pending_property` → `active`.
- [ ] Confirm no tokens appear in browser network responses or page source.

## Pending (next phase)

- GA4 and Search Console **metric sync** and `GOOGLE_SYNC_CRON_SECRET` cron routes.
- Client portal self-service OAuth (backend supports `initiator_context: client`).
