# Admin dashboard stats — RLS probe

Read-only checks for the **11 PostgREST queries** used by `getAdminDashboardStats` in `src/lib/data/admin/queries.ts`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run verify:admin-dashboard-stats-logic` | Fixture equivalence (legacy vs count-based), no database |
| `npm run verify:admin-dashboard-stats-rls` | RLS probe against Supabase (demo users) |
| `npm run verify:admin-dashboard-stats` | Both of the above |

Shared query mirror: `scripts/admin-dashboard-stats-queries.mjs` (keep in sync with `queries.ts`).

## Running the RLS probe

1. Local or demo Supabase with seed data (`npm run db:seed:demo` if needed).
2. `.env.local` with:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `DEMO_OWNER_PASSWORD`
   - `DEMO_CLIENT_PASSWORD`

```bash
npm run verify:admin-dashboard-stats-rls
```

## Personas

| Persona | Expectation |
|---------|-------------|
| **OWNER (staff)** | All 11 queries return without error; company count &gt; 0 on demo seed |
| **CLIENT (authenticated, non-staff)** | No metric exceeds staff scope on platform-wide keys (`companies`, `projects_total`, `payments_succeeded`, etc.); permission denied is acceptable |
| **ANON (no session)** | No platform admin aggregates: permission denied or visible count 0 (PostgREST may return an empty `error.message` with `count: null` under RLS) |

## What is not covered

- Hosted production or booking test projects (use demo/local only).
- UI-level permission gating on `/admin/*` routes (app layer).
- Performance of `count: exact`.

## Integration

`verify:admin-dashboard-stats-logic` is included in `npm run verify:admin-dashboard-stats` and in `npm run db:verify:admin:complete` (after phase 1.5 checks).
