/**
 * Read-only preflight for migration 022 (SELECT only — no DDL/DML, no secrets printed).
 *
 * BOOKING_M022_PREFLIGHT=1 npx -p pg node --env-file=.env.booking.test.local scripts/booking-migration-022-preflight-readonly.mjs
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { BOOKING_ALLOWLISTED_PROJECT_REFS, BOOKING_TEST_USERS, SLUGS } from "./booking-integration-fixtures.mjs";
import {
  assertBookingDatabaseTarget,
  assertKeysPresent,
  BOOKING_REMOTE_TESTS_ENV,
  extractSupabaseProjectRef,
  getSupabaseEnv,
} from "./booking-test-guards.mjs";
import { resolveReadonlyDatabaseUrl } from "./booking-readiness-lib.mjs";
import { MIGRATION_022_FILE, readMigration022Sql } from "./booking-professional-rls-phase2-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXPECTED_REF = "bwxhdoxesqtdqwkxrmom";

const M022_OBJECT_NAMES = {
  table: "booking_customer_internal_notes",
  trigger: "booking_customer_internal_notes_business_match",
  triggerFn: "booking_trg_customer_internal_notes_business_match",
  unique: "booking_customers_id_business_key",
  fk: "booking_customer_internal_notes_customer_business_fkey",
  fn022: "booking_is_professional_member",
};

function passFail(ok, label, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `: ${detail}` : ""}`);
  return ok;
}

async function runPgReadonlyProbe() {
  try {
    const { runBookingMigration022PgProbe } = await import("./booking-migration-022-pg-probe.mjs");
    return await runBookingMigration022PgProbe();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("'pg'") || msg.includes("Cannot find package")) {
      throw new Error(
        "Install pg probe deps: npx -p pg node --env-file=.env.booking.test.local scripts/booking-migration-022-preflight-readonly.mjs",
      );
    }
    throw e;
  }
}

async function probeIntegrationViaRest(env) {
  const admin = createClient(env.url, env.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: usersData, error: usersErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emails = Object.values(BOOKING_TEST_USERS).map((u) => u.email.toLowerCase());
  const found = (usersData?.users ?? []).filter((u) => emails.includes((u.email ?? "").toLowerCase()));
  const userByEmail = Object.fromEntries(found.map((u) => [u.email?.toLowerCase(), u.id]));

  const { data: bizRows } = await admin
    .from("booking_businesses")
    .select("id, slug")
    .in("slug", [SLUGS.businessA, SLUGS.businessB]);

  const bizA = bizRows?.find((b) => b.slug === SLUGS.businessA)?.id;
  const bizB = bizRows?.find((b) => b.slug === SLUGS.businessB)?.id;

  let memberships = [];
  if (bizA || bizB) {
    const q = admin.from("booking_business_members").select("business_id, user_id, role");
    if (bizA && bizB) q.in("business_id", [bizA, bizB]);
    else if (bizA) q.eq("business_id", bizA);
    else q.eq("business_id", bizB);
    const { data } = await q;
    memberships = data ?? [];
  }

  let staffRows = [];
  if (bizA || bizB) {
    const q = admin.from("booking_staff").select("id, business_id, display_name, profile_id, is_active");
    if (bizA && bizB) q.in("business_id", [bizA, bizB]);
    else if (bizA) q.eq("business_id", bizA);
    else q.eq("business_id", bizB);
    const { data } = await q;
    staffRows = data ?? [];
  }

  const staffMemberAId = userByEmail[BOOKING_TEST_USERS.staffMemberA.email.toLowerCase()];
  const staffLinkedToA = staffRows.filter(
    (s) =>
      String(s.business_id) === String(bizA) &&
      staffMemberAId != null &&
      String(s.profile_id) === String(staffMemberAId),
  );

  return {
    usersErr: usersErr?.message ?? null,
    usersExpected: emails.length,
    usersFound: found.length,
    userByEmail: Object.fromEntries(emails.map((e) => [e, userByEmail[e] ? "present" : "missing"])),
    businesses: { a: bizA ?? null, b: bizB ?? null },
    membershipsCount: memberships.length,
    memberships: memberships.map((m) => ({
      business:
        String(m.business_id) === String(bizA)
          ? "A"
          : String(m.business_id) === String(bizB)
            ? "B"
            : m.business_id,
      role: m.role,
      user: Object.entries(userByEmail).find(([, id]) => id === m.user_id)?.[0] ?? m.user_id,
    })),
    staffCount: staffRows.length,
    staffProfileLinks: staffRows.map((s) => ({
      business:
        String(s.business_id) === String(bizA)
          ? "A"
          : String(s.business_id) === String(bizB)
            ? "B"
            : "?",
      display_name: s.display_name,
      profile_id: s.profile_id ? "set" : "null",
      matches_staffMemberA: staffMemberAId != null && String(s.profile_id) === String(staffMemberAId),
    })),
    staffMemberAProfileLinkedCount: staffLinkedToA.length,
  };
}

async function main() {
  if (process.env.BOOKING_M022_PREFLIGHT !== "1") {
    console.log("Skip: set BOOKING_M022_PREFLIGHT=1");
    process.exit(0);
  }

  console.log("=== Migration 022 preflight (read-only) ===\n");
  console.log("Remote policy: SELECT-only catalog probes + REST read; no DDL/DML/apply.\n");

  const env = getSupabaseEnv();
  const publicUrl = env.url?.trim();
  let allOk = true;
  const risks = [];

  try {
    const ref = extractSupabaseProjectRef(publicUrl);
    allOk = passFail(ref === EXPECTED_REF, "Project ref from NEXT_PUBLIC_SUPABASE_URL", ref ?? "invalid") && allOk;
    const target = assertBookingDatabaseTarget(publicUrl);
    allOk =
      passFail(
        BOOKING_ALLOWLISTED_PROJECT_REFS.includes(target.projectRef ?? ""),
        "Allowlisted test project",
        target.projectRef ?? "",
      ) && allOk;
    console.log(`INFO  Target kind: ${target.kind}`);
  } catch (e) {
    passFail(false, "Target guard", e.message);
    process.exit(1);
  }

  allOk =
    passFail(process.env[BOOKING_REMOTE_TESTS_ENV] === "1", `${BOOKING_REMOTE_TESTS_ENV}=1`) && allOk;

  try {
    assertKeysPresent(env);
    passFail(true, "Supabase API keys present (values not printed)");
  } catch (e) {
    allOk = passFail(false, "Supabase API keys", e.message) && allOk;
  }

  passFail(Boolean(resolveReadonlyDatabaseUrl()), "DB password / DATABASE_URL for catalog (value not printed)");

  let linkedRef = null;
  try {
    linkedRef = JSON.parse(
      readFileSync(resolve(__dirname, "../supabase/.temp/linked-project.json"), "utf8"),
    ).ref;
    passFail(linkedRef === EXPECTED_REF, "Supabase CLI linked project ref", linkedRef ?? "none");
  } catch {
    console.log("INFO  supabase/.temp/linked-project.json not readable (CLI link optional)");
  }

  const migPath = resolve(__dirname, "../supabase/migrations", MIGRATION_022_FILE);
  const migBytes = readFileSync(migPath, "utf8");
  const migSha = createHash("sha256").update(migBytes).digest("hex").slice(0, 16);
  try {
    const fromLib = readMigration022Sql();
    passFail(fromLib === migBytes, "Local migration 022 matches verifier readMigration022Sql()");
  } catch (e) {
    allOk = passFail(false, "Local migration 022 verifier", e.message) && allOk;
  }
  console.log(`INFO  Local ${MIGRATION_022_FILE} sha256 prefix: ${migSha} (${migBytes.length} bytes, untracked/WIP)`);

  /** @type {Record<string, unknown>} */
  let pg = {};
  const dbUrl = resolveReadonlyDatabaseUrl();
  if (dbUrl) {
    try {
      pg = await runPgReadonlyProbe();
      if (pg.error === "missing_database_url") {
        allOk = passFail(false, "PostgreSQL read-only catalog probe", pg.error) && allOk;
      } else {
        passFail(true, "PostgreSQL read-only catalog probe");
        console.log(
          `INFO  DB catalog: database=${pg.project?.[0]?.db ?? "?"}, user=${pg.project?.[0]?.db_user ?? "?"}`,
        );
      }
    } catch (e) {
      allOk = passFail(false, "PostgreSQL read-only catalog probe", e.message) && allOk;
    }
  } else {
    risks.push("No DATABASE_URL / SUPABASE_DB_PASSWORD — catalog checks 3–6 blocked.");
  }

  console.log("\n--- Migrations 020 / 021 (PostgreSQL catalog) ---");
  if (pg.fn_normalize?.length) {
    passFail(true, "020 function booking_normalize_member_role_text exists");
  } else if (dbUrl) {
    allOk = passFail(false, "020 function booking_normalize_member_role_text") && allOk;
  }
  if (pg.trg_member_role?.length) {
    passFail(true, "020 trigger booking_normalize_member_role on booking_business_members");
  } else if (dbUrl) {
    allOk = passFail(false, "020 trigger booking_normalize_member_role") && allOk;
  }
  const chkDef = pg.chk_members_role?.[0]?.def ?? "";
  if (chkDef.includes("professional")) {
    passFail(true, "020 CHECK booking_business_members_role_check includes professional");
  } else if (dbUrl) {
    allOk = passFail(false, "020 members role CHECK", chkDef || "missing") && allOk;
  }
  const schemaDescr = (pg.schema_comment_public ?? pg.schema_comment_020)?.[0]?.descr ?? "";
  if (schemaDescr.includes("020")) {
    passFail(true, "020 schema comment marker on public");
  } else if (schemaDescr.includes("021") && (pg.fn_normalize?.length ?? 0) > 0) {
    console.log(
      "INFO  public schema comment shows 021 (021 overwrites 020 comment); 020 inferred from catalog objects",
    );
  } else if (dbUrl) {
    allOk = passFail(false, "020 schema comment / catalog", schemaDescr || "empty") && allOk;
  }
  if (pg.fn_invite?.[0]?.invite_mentions_professional) {
    passFail(true, "020 booking_create_member_invite body references professional");
  } else if (dbUrl) {
    allOk = passFail(false, "020 invite RPC professional semantics") && allOk;
  }
  if ((pg.trg_invite_role?.length ?? 0) > 0) {
    passFail(true, "020 trigger booking_normalize_invite_role present");
  } else if (dbUrl) {
    allOk = passFail(false, "020 trigger booking_normalize_invite_role") && allOk;
  }

  const roleColComment = pg.col_role_comment?.[0]?.descr ?? "";
  if (roleColComment.toLowerCase().includes("professional")) {
    passFail(true, "021 column comment on booking_business_members.role");
  } else if (dbUrl) {
    allOk = passFail(false, "021 column comment on role", roleColComment || "empty") && allOk;
  }
  const grants = pg.normalize_grants ?? [];
  const publicExecute = grants.some((g) => g.grantee === "PUBLIC" && g.privilege_type === "EXECUTE");
  const authExecute = grants.some((g) => g.grantee === "authenticated" && g.privilege_type === "EXECUTE");
  if (!publicExecute && !authExecute) {
    passFail(true, "021 normalize helper not EXECUTE-granted to PUBLIC/authenticated");
  } else if (dbUrl) {
    allOk = passFail(false, "021 normalize helper grants", JSON.stringify(grants)) && allOk;
  }

  console.log("\n--- Prerequisites for 022 (schema) ---");
  for (const [table, ok] of Object.entries(pg.tables ?? {})) {
    if (!ok) allOk = passFail(false, `Table public.${table}`) && allOk;
  }
  if (pg.tables && Object.values(pg.tables).every(Boolean)) {
    passFail(true, "Core booking tables for 022 present");
  }

  const notesCol = (pg.customers_notes_col?.length ?? 0) > 0;
  if (notesCol) {
    passFail(true, "booking_customers.notes column still present (expected pre-022)");
  } else if (dbUrl) {
    if ((pg.internal_notes_table?.length ?? 0) > 0) {
      passFail(true, "booking_customers.notes absent but internal_notes table exists (post-022?)", "review");
    } else {
      allOk = passFail(false, "booking_customers.notes column missing without internal_notes") && allOk;
    }
  }

  if (pg.notes_migration_stats?.error) {
    console.log(`WARN  notes stats: ${pg.notes_migration_stats.error}`);
  } else if (pg.notes_migration_stats) {
    const st = Array.isArray(pg.notes_migration_stats) ? pg.notes_migration_stats[0] : pg.notes_migration_stats;
    console.log(
      `INFO  booking_customers: total=${st?.total_customers}, nonempty_notes=${st?.nonempty_notes}`,
    );
    const n = Number(st?.nonempty_notes ?? 0);
    if (n > 0) {
      risks.push(`${n} customer row(s) with non-empty notes will be copied to booking_customer_internal_notes on apply.`);
    }
  }

  console.log("\n--- 022 object conflicts (must be absent pre-apply) ---");
  const fn022 = (pg.fn_022?.length ?? 0) > 0;
  const notesTable = (pg.internal_notes_table?.length ?? 0) > 0;
  if (!fn022) passFail(true, "booking_is_professional_member not present yet");
  else {
    allOk = passFail(false, "booking_is_professional_member already exists") && allOk;
    risks.push("022 may be partially or fully applied (helper exists).");
  }
  if (!notesTable) passFail(true, "booking_customer_internal_notes table not present yet");
  else {
    allOk = passFail(false, "booking_customer_internal_notes already exists") && allOk;
    risks.push("Internal notes table already exists — migration uses IF NOT EXISTS + backfill.");
  }

  const namedCons = pg.named_constraints ?? [];
  if (namedCons.length === 0) {
    passFail(true, "No pre-existing 022-named UNIQUE/FK constraints");
  } else {
    for (const c of namedCons) {
      allOk = passFail(false, `Constraint ${c.conname} on ${c.table_name} already exists`) && allOk;
      risks.push(`Constraint ${c.conname} exists — 022 DO block may skip or raise.`);
    }
  }
  if ((pg.named_triggers?.length ?? 0) === 0) {
    passFail(true, "Trigger booking_customer_internal_notes_business_match not present");
  } else {
    allOk = passFail(false, "022 trigger already present") && allOk;
  }

  if (pg.unique_id_business?.length) {
    console.log(
      `INFO  Existing UNIQUE on booking_customers: ${pg.unique_id_business.map((u) => u.conname).join(", ")}`,
    );
  }

  console.log("\n--- Integration test users / staff profile_id (REST read) ---");
  let rest = null;
  try {
    rest = await probeIntegrationViaRest(env);
    if (rest.usersErr) {
      allOk = passFail(false, "Auth admin list users", rest.usersErr) && allOk;
    } else {
      passFail(
        rest.usersFound === rest.usersExpected,
        "Booking test auth users present",
        `${rest.usersFound}/${rest.usersExpected}`,
      );
      for (const [email, state] of Object.entries(rest.userByEmail)) {
        if (state === "missing") {
          allOk = passFail(false, `User ${email}`) && allOk;
        }
      }
    }
    passFail(Boolean(rest.businesses.a), "Integration business A slug", SLUGS.businessA);
    passFail(Boolean(rest.businesses.b), "Integration business B slug", SLUGS.businessB);
    if (!rest.businesses.a || !rest.businesses.b) {
      allOk = false;
      risks.push("Integration seed businesses missing — run db:seed:booking-integration on test project.");
    }
    console.log(`INFO  Membership rows (A/B): ${rest.membershipsCount}`);
    for (const m of rest.memberships) {
      console.log(`      business=${m.business} role=${m.role} user=${m.user}`);
    }
    if (rest.staffMemberAProfileLinkedCount >= 1) {
      passFail(true, "staffMemberA linked via booking_staff.profile_id on business A");
    } else {
      allOk =
        passFail(
          false,
          "staffMemberA profile_id → booking_staff on business A",
          "seed does not set profile_id — Phase 2 P2-* professional scope tests need manual link",
        ) && allOk;
      risks.push(
        "No booking_staff.profile_id for booking-staff-member-a@artecium.test on salon A — link before runtime P2 tests.",
      );
    }
    console.log(`INFO  Staff rows on A/B: ${rest.staffCount}`);
    for (const s of rest.staffProfileLinks) {
      console.log(
        `      biz=${s.business} name=${s.display_name} profile_id=${s.profile_id} matches_staffMemberA=${s.matches_staffMemberA}`,
      );
    }
    const profB = rest.memberships.find(
      (m) => m.business === "B" && (m.role === "professional" || m.role === "staff"),
    );
    if (!profB) {
      console.log("INFO  No professional member on business B (owner-only B is normal for cross-tenant tests).");
    }
  } catch (e) {
    allOk = passFail(false, "REST integration probe", e.message) && allOk;
  }

  console.log("\n--- Readiness summary ---");
  if (risks.length) {
    console.log("Risks / follow-ups:");
    for (const r of risks) console.log(`  - ${r}`);
  } else {
    console.log("Risks: none identified from this probe.");
  }

  const schemaReadyFor022 =
    dbUrl &&
    (pg.fn_normalize?.length ?? 0) > 0 &&
    (pg.customers_notes_col?.length ?? 0) > 0 &&
    !(pg.fn_022?.length ?? 0) &&
    Object.values(pg.tables ?? {}).every(Boolean);

  if (allOk && dbUrl) {
    console.log("\nREADY  Catalog + guards OK for authorized apply of 022 on test project (no apply performed).");
  } else if (schemaReadyFor022) {
    console.log(
      "\nREADY*  Schema/guards OK for 022 apply on test DB; fix staff profile_id before P2 runtime tests.",
    );
  } else if (!dbUrl) {
    console.log("\nBLOCKED  Provide SUPABASE_DB_PASSWORD (or DATABASE_URL) to complete catalog preflight.");
  } else {
    console.log("\nBLOCKED  Resolve FAIL items before apply.");
  }

  console.log("\nCONFIRM  No migration apply, DDL, or DML was executed in this run.");
  process.exit(allOk && dbUrl ? 0 : 1);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
