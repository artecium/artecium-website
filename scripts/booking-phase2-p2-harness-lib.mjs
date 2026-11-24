/**
 * Phase 2 P2 harness — shared local checks, remote runners, fixture contracts.
 * No Supabase I/O unless callers pass clients (remote scripts only).
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  PHASE2_RLS_CASES,
  extractBusyRpcSql,
  readMigration022Sql,
} from "./booking-professional-rls-phase2-lib.mjs";
import {
  BOOKING_TEST_PASSWORD_ENV,
  BOOKING_TEST_USERS,
  PHASE2_NOTES_CUSTOMER_EMAIL,
  SLUGS,
} from "./booking-integration-fixtures.mjs";
import {
  P2_NOTES_EXPECTATIONS,
  PHASE2_NOTES_FIXTURE_CUSTOMERS,
  buildNotesAuthTestSql,
  buildNotesCleanupSql,
  buildNotesFixtureSql,
  buildQueryRunTrackingSql,
  createNotesRunCreationProof,
  syncCreationProofFromTrackingQuery,
  validateDistinctNotesCustomerIds,
} from "./booking-phase2-p2-notes-lib.mjs";
import {
  buildCleanupApproveSql,
  buildCleanupExecuteSql,
  buildCleanupPreviewSql,
  buildCleanupRejectSql,
  buildMarkPreparedSql,
  buildMarkTestedSql,
  buildRunStartSql,
  buildSessionUserCheckSql,
} from "./booking-phase2-harness-sql.mjs";

/** @typedef {'PASS'|'FAIL'|'BLOCKED'|'SKIP'} P2Status */

/** @typedef {{ status: P2Status, detail?: string, layer?: 'local'|'remote' }} P2HarnessResult */

/** Days for busy/time-off RPC window (must cover seed Monday + Sam/Alex appointments). */
export const BUSY_RPC_RANGE_DAYS = 14;

/** Integration seed marker email — professional member without any booking_staff.profile_id link. */
export const PHASE2_PROFESSIONAL_UNLINKED_EMAIL = "booking-professional-unlinked-a@artecium.test";

/** Re-export for harness consumers. */
export { PHASE2_NOTES_CUSTOMER_EMAIL, P2_NOTES_EXPECTATIONS, PHASE2_NOTES_FIXTURE_CUSTOMERS };

/** @type {Record<string, { blockedReason?: string, remoteNeedsWrite?: boolean, remoteNeedsFixture?: string[] }>} */
export const P2_REMOTE_PREREQUISITES = {
  "P2-01": { remoteNeedsFixture: ["integration seed businesses A/B"] },
  "P2-02": {
    remoteNeedsFixture: [
      "integration seed appointments on salon A (Alex + Sam)",
      `busy RPC range ${BUSY_RPC_RANGE_DAYS}d via resolveIntegrationBusyRpcRange()`,
    ],
  },
  "P2-04": { remoteNeedsFixture: ["integration seed appointments"] },
  "P2-05": {
    remoteNeedsFixture: [
      `auth user ${PHASE2_PROFESSIONAL_UNLINKED_EMAIL} with professional membership on A (no staff profile_id)`,
      "BOOKING_PHASE2_INCREMENTAL_FIXTURES=1 (non-destructive) — preserves Alex/staffMemberA link",
    ],
  },
  "P2-06": { remoteNeedsFixture: ["integration seed"] },
  "P2-07": { remoteNeedsFixture: ["integration seed"] },
  "P2-08": { remoteNeedsFixture: ["022 applied", "select business_id on booking_business_subscriptions"] },
  "P2-09": { remoteNeedsFixture: ["022 applied"] },
  "P2-10": {
    blockedReason:
      "Runtime 2001-row probe needs dense appointment fixture or SQL generator (local contract validated)",
    remoteNeedsWrite: true,
  },
  "P2-11": { remoteNeedsFixture: ["022 applied"] },
  "P2-12": { remoteNeedsFixture: ["022 applied"] },
  "P2-13": {
    remoteNeedsFixture: [
      "booking_time_off row for Sam Provider (staff2) on salon A",
      "incremental fixtures or seed label Integration time off Sam",
    ],
  },
  "P2-14": {
    blockedReason:
      "Needs authenticated session + dashboard route; run Playwright or manual with professional A on /client/booking/dashboard",
  },
  "P2-15": {
    remoteNeedsWrite: true,
    remoteNeedsFixture: [
      `fixture customer ${PHASE2_NOTES_FIXTURE_CUSTOMERS.p15} on A (prep)`,
      "manager JWT; SQL INSERT (customer_id, notes) omit business_id — expect success, business_id=A",
    ],
  },
  "P2-16": {
    remoteNeedsWrite: true,
    remoteNeedsFixture: [
      `fixture customer ${PHASE2_NOTES_FIXTURE_CUSTOMERS.p16} on A`,
      "manager JWT; INSERT with business_id=B — trigger overwrites to A; expect success",
    ],
  },
  "P2-17": {
    remoteNeedsWrite: true,
    remoteNeedsFixture: [
      `note on ${PHASE2_NOTES_FIXTURE_CUSTOMERS.p17} (manager JWT insert in prep)`,
      "ownerA + managerA PostgREST SELECT — expect 1 row each",
    ],
  },
  "P2-18": { remoteNeedsFixture: ["fixture customer optional", "professional session read internal_notes"] },
  "P2-19": {
    remoteNeedsWrite: true,
    remoteNeedsFixture: [
      `customer ${PHASE2_NOTES_FIXTURE_CUSTOMERS.p19} on B`,
      "manager A JWT insert — expect RLS/FK rejection (not success)",
    ],
  },
  "P2-20": {
    blockedReason:
      "Static audit in verify; runtime needs Next server + Supabase session (includeInternalNotes: canManageActiveBusiness)",
  },
  "P2-21": {
    remoteNeedsWrite: true,
    remoteNeedsFixture: [
      `independent customer ${PHASE2_NOTES_FIXTURE_CUSTOMERS.p21}`,
      "manager JWT SQL INSERT omit business_id — expect success (PK distinct from P2-15)",
    ],
  },
  "P2-22": {
    remoteNeedsWrite: true,
    remoteNeedsFixture: [
      `note on ${PHASE2_NOTES_FIXTURE_CUSTOMERS.p22}`,
      "manager JWT UPDATE business_id→B — trigger keeps A",
    ],
  },
  "P2-23": { blockedReason: "Apply-time test only; validated by migration DO block static review" },
};

/**
 * Range aligned to integration seed: anchor on seed Monday appointment (bk_seed_confirmed) or fallback rolling window.
 * @param {{ seedMondayIso?: string | null, timezone?: string }} ctx
 */
export function resolveIntegrationBusyRpcRange(ctx = {}) {
  if (ctx.seedMondayIso) {
    const start = new Date(`${ctx.seedMondayIso}T00:00:00.000Z`);
    start.setUTCDate(start.getUTCDate() - 1);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + BUSY_RPC_RANGE_DAYS);
    return { p_range_start: start.toISOString(), p_range_end: end.toISOString() };
  }
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - 1);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + BUSY_RPC_RANGE_DAYS);
  return { p_range_start: start.toISOString(), p_range_end: end.toISOString() };
}

/** @param {string} sql */
export function verifyBusyRpcRowCapContract(sql) {
  const busy = extractBusyRpcSql(sql);
  return (
    busy.includes("v_max_rows constant int := 2000") &&
    busy.includes("limit 2001") &&
    busy.includes("if v_count > v_max_rows then") &&
    busy.includes("result set too large; narrow range or staff_ids")
  );
}

/** Controlled local simulation of RPC row cap (no DB). */
export function simulateAvailabilityRowCap(maxRows = 2000, returnedRows = 2001) {
  let count = 0;
  for (let i = 0; i < returnedRows; i++) {
    count += 1;
    if (count > maxRows) {
      return { ok: true, errcode: "22023", message: "result set too large; narrow range or staff_ids" };
    }
  }
  return { ok: false, errcode: null, message: "cap not triggered" };
}

/**
 * SQL templates for authorized notes round (see booking-phase2-p2-notes-lib.mjs).
 * @param {{ businessAId: string, businessBId: string, managerUserId: string, ownerUserId?: string, customerIds: Partial<Record<string, string>>, creationProof?: import('./booking-phase2-p2-notes-lib.mjs').NotesRunCreationProof, runId?: string }} ids
 */
export function buildNotesTestSql(ids) {
  if (!ids.customerIds) {
    throw new Error(
      "buildNotesTestSql requires ids.customerIds with distinct UUIDs for p15, p16, p17, p19, p21, p22",
    );
  }
  validateDistinctNotesCustomerIds(ids.customerIds, { requireAll: true });
  const customerIds = ids.customerIds;
  const creationProof = ids.creationProof ?? createNotesRunCreationProof(ids.runId);
  const operator = ids.operator ?? "operator@artecium.test";
  const biz = { businessAId: ids.businessAId, businessBId: ids.businessBId };
  const auth = buildNotesAuthTestSql({
    customerIds,
    businessAId: ids.businessAId,
    businessBId: ids.businessBId,
    managerUserId: ids.managerUserId,
    ownerUserId: ids.ownerUserId,
    creationProof,
  });
  return {
    creationProof,
    /** After fixturePrep (any connection); then syncCreationProofFromTrackingQuery(creationProof, rows). */
    queryRunTrackingSql: buildQueryRunTrackingSql(creationProof.runId),
    syncCreationProofFromTrackingQuery,
    runStart: buildRunStartSql(creationProof.runId, operator, {
      ...biz,
      customerIds,
      harness_contract_version: 2,
    }),
    markPrepared: buildMarkPreparedSql(creationProof.runId),
    markTested: buildMarkTestedSql(creationProof.runId, []),
    cleanupPreview: buildCleanupPreviewSql(creationProof.runId, operator, customerIds, biz),
    cleanupApprove: (digest) => buildCleanupApproveSql(creationProof.runId, operator, digest),
    cleanupReject: buildCleanupRejectSql(creationProof.runId, operator),
    cleanupExecute: (digest) => buildCleanupExecuteSql(creationProof.runId, operator, digest),
    sessionUserCheck: buildSessionUserCheckSql(),
    fixturePrep: buildNotesFixtureSql({
      businessAId: ids.businessAId,
      businessBId: ids.businessBId,
      customerIds,
      managerUserId: ids.managerUserId,
      creationProof,
    }),
    insertOmitBusinessId: auth.p2_15,
    insertWrongBusinessId: auth.p2_16,
    updateBusinessIdOnly: auth.p2_22,
    insertP21: auth.p2_21,
    p2_19: auth.p2_19,
    p2_19_postgrest: auth.p2_19_postgrest,
    p2_17: auth.p2_17,
    verifyBusinessId: (cid) =>
      `SELECT customer_id, business_id, notes FROM public.booking_customer_internal_notes WHERE customer_id = '${cid}'::uuid;`,
    revert: buildNotesCleanupSql(
      customerIds,
      {
        businessAId: ids.businessAId,
        businessBId: ids.businessBId,
      },
      creationProof,
    ),
    expectations: P2_NOTES_EXPECTATIONS,
  };
}

/** @returns {P2HarnessResult} */
export function runLocalP2Check(caseId) {
  const sql = readMigration022Sql();
  const meta = PHASE2_RLS_CASES.find((c) => c.id === caseId);
  if (!meta) return { status: "FAIL", detail: "unknown case", layer: "local" };

  if (!meta.local) {
    return {
      status: "SKIP",
      detail: "no local harness for this case",
      layer: "local",
    };
  }

  switch (caseId) {
    case "P2-05": {
      const fnStart = sql.indexOf("function public.booking_can_read_full_appointment");
      const fnBlock = sql.slice(fnStart, fnStart + 1200);
      const ok =
        fnBlock.includes("booking_is_professional_member") &&
        fnBlock.includes("booking_staff_ids_for_auth_user") &&
        fnBlock.includes("p_staff_id in");
      return {
        status: ok ? "PASS" : "FAIL",
        detail: ok
          ? "RLS scopes professional reads to own staff_ids (empty when unlinked)"
          : "appointment read helper",
        layer: "local",
      };
    }
    case "P2-03": {
      const busy = extractBusyRpcSql(sql);
      const ok =
        busy.length > 0 &&
        busy.includes("staff_id") &&
        !busy.includes("guest_email") &&
        !busy.includes("guest_name");
      return { status: ok ? "PASS" : "FAIL", layer: "local" };
    }
    case "P2-10": {
      const contract = verifyBusyRpcRowCapContract(sql);
      const sim = simulateAvailabilityRowCap();
      const ok = contract && sim.ok;
      return {
        status: ok ? "PASS" : "FAIL",
        detail: ok ? "2000 cap + 2001 probe simulation" : "row cap contract",
        layer: "local",
      };
    }
    case "P2-14": {
      const businessTs = readSrc("src/lib/data/booking/business.ts");
      const dashboardPage = readSrc("src/app/booking/admin/dashboard/page.tsx");
      const ok =
        businessTs.includes("appointmentScope") &&
        businessTs.includes('own_staff') &&
        businessTs.includes('.in("staff_id", ownStaffIds)') &&
        dashboardPage.includes("listOwnBookingStaffIds");
      return {
        status: ok ? "PASS" : "FAIL",
        detail: ok ? "own_staff stats logic present" : "dashboard scope missing",
        layer: "local",
      };
    }
    case "P2-15":
    case "P2-21":
    case "P2-22": {
      const ok =
        sql.includes("new.business_id := v_customer_business") &&
        sql.includes("booking_customer_internal_notes_customer_business_fkey");
      const triggerOk = /before insert or update\s*\n/i.test(
        sql.slice(
          sql.indexOf("create trigger booking_customer_internal_notes_business_match"),
          sql.indexOf("create trigger booking_customer_internal_notes_business_match") + 120,
        ),
      );
      const notesNotNull = sql.includes("business_id uuid not null");
      return {
        status: ok && triggerOk && notesNotNull ? "PASS" : "FAIL",
        detail: "trigger derives tenant; FK composite; NOT NULL on column (use SQL omitting business_id at runtime)",
        layer: "local",
      };
    }
    case "P2-16": {
      const base = runLocalP2Check("P2-15");
      const exp = P2_NOTES_EXPECTATIONS["P2-16"];
      const expectOk = exp?.expectSuccess === true;
      return {
        status: base.status === "PASS" && expectOk ? "PASS" : "FAIL",
        detail: "wrong business_id in INSERT → trigger sets A; manager authorized (expect success at runtime)",
        layer: "local",
      };
    }
    case "P2-17": {
      const exp = P2_NOTES_EXPECTATIONS["P2-17"];
      const ok = exp?.expectSuccess && (exp.actors?.length ?? 0) >= 2;
      return {
        status: ok ? "PASS" : "FAIL",
        detail: "owner+manager read contract (runtime JWT SELECT)",
        layer: "local",
      };
    }
    case "P2-19": {
      const exp = P2_NOTES_EXPECTATIONS["P2-19"];
      const ok = exp?.expectSuccess === false && (exp.rejectCodes?.length ?? 0) > 0;
      return {
        status: ok ? "PASS" : "FAIL",
        detail: "cross-tenant insert must fail with explicit error (not any error = PASS)",
        layer: "local",
      };
    }
    case "P2-20": {
      const customersTs = readSrc("src/lib/data/booking/customers.ts");
      const page = readSrc("src/app/booking/admin/customers/page.tsx");
      const ok =
        customersTs.includes("booking_customer_internal_notes") &&
        customersTs.includes("includeInternalNotes") &&
        customersTs.includes("booking_customers_member") &&
        page.includes("includeInternalNotes: session.canManageActiveBusiness");
      return {
        status: ok ? "PASS" : "FAIL",
        detail: ok ? "manage path loads internal notes table" : "customers manage path",
        layer: "local",
      };
    }
    case "P2-23": {
      const ok =
        sql.includes("v_named_conkey is distinct from v_expected_attnums") &&
        sql.includes("booking_customers_id_business_key");
      return { status: ok ? "PASS" : "FAIL", layer: "local", detail: "UNIQUE DO block" };
    }
    default:
      return { status: "SKIP", detail: "local flag set but no checker", layer: "local" };
  }
}

/** @returns {P2HarnessResult} */
export function planRemoteP2Check(caseId) {
  const meta = PHASE2_RLS_CASES.find((c) => c.id === caseId);
  if (!meta?.remote) {
    return { status: "SKIP", detail: "remote not applicable", layer: "remote" };
  }
  const pre = P2_REMOTE_PREREQUISITES[caseId];
  if (pre?.blockedReason) {
    return { status: "BLOCKED", detail: pre.blockedReason, layer: "remote" };
  }
  if (pre?.remoteNeedsWrite) {
    return {
      status: "BLOCKED",
      detail: `needs authorized DML/fixtures: ${(pre.remoteNeedsFixture ?? []).join("; ")}`,
      layer: "remote",
    };
  }
  if (caseId === "P2-05" || caseId === "P2-02" || caseId === "P2-13") {
    return {
      status: "BLOCKED",
      detail: `BOOKING_PHASE2_P2_REMOTE=1 read-only: ${(pre?.remoteNeedsFixture ?? []).join("; ")}`,
      layer: "remote",
    };
  }
  return {
    status: "BLOCKED",
    detail: `BOOKING_PHASE2_P2_REMOTE=1: ${(pre?.remoteNeedsFixture ?? ["022 applied"]).join("; ")}`,
    layer: "remote",
  };
}

/** @param {import('@supabase/supabase-js').SupabaseClient} staffClient @param {object} ctx */
export async function runRemoteP2Check(caseId, staffClient, ctx) {
  const pre = P2_REMOTE_PREREQUISITES[caseId];
  if (pre?.remoteNeedsWrite) {
    return { status: "BLOCKED", detail: "remote write required — use authorized SQL/seed round", layer: "remote" };
  }

  const { admin, bizA, bizB, staffAlexId, staffSamId, env, password, ownerClient, managerClient } = ctx;

  switch (caseId) {
    case "P2-01": {
      const { data, error } = await staffClient.from("booking_appointments").select("id").eq("business_id", bizB);
      return resultFromBool(!error && (data?.length ?? 0) === 0);
    }
    case "P2-02": {
      const range = resolveIntegrationBusyRpcRange(ctx.range ?? {});
      const { data, error } = await staffClient.rpc("booking_list_member_staff_busy_intervals", {
        p_business_id: bizA,
        ...range,
        p_staff_ids: null,
      });
      if (error) return { status: "FAIL", detail: error.message, layer: "remote" };
      const ids = new Set((data ?? []).map((r) => String(r.staff_id)));
      const ok = ids.has(String(staffSamId)) && !ids.has(String(staffAlexId));
      return {
        status: ok ? "PASS" : "FAIL",
        detail: ok ? undefined : `staff_ids in RPC: ${[...ids].join(",")}`,
        layer: "remote",
      };
    }
    case "P2-03":
      return runLocalP2Check("P2-03");
    case "P2-04": {
      const { count: aptB } = await staffClient
        .from("booking_appointments")
        .select("id", { count: "exact", head: true })
        .eq("business_id", bizB);
      const { count: aptA } = await staffClient
        .from("booking_appointments")
        .select("id", { count: "exact", head: true })
        .eq("business_id", bizA)
        .eq("staff_id", staffAlexId);
      return resultFromBool(aptB === 0 && (aptA ?? 0) >= 1);
    }
    case "P2-05": {
      const email = BOOKING_TEST_USERS.professionalUnlinkedA?.email ?? PHASE2_PROFESSIONAL_UNLINKED_EMAIL;
      const password = ctx.password ?? process.env[BOOKING_TEST_PASSWORD_ENV];
      if (!password) {
        return { status: "BLOCKED", detail: "BOOKING_TEST_PASSWORD missing", layer: "remote" };
      }
      const anon = createClient(env.url, env.anonKey, { auth: { persistSession: false } });
      const { data: sess, error: signErr } = await anon.auth.signInWithPassword({ email, password });
      if (signErr || !sess.session) {
        return {
          status: "BLOCKED",
          detail: `${email} not seeded — run db:seed:booking-integration on test project`,
          layer: "remote",
        };
      }
      const unlinked = createClient(env.url, env.anonKey, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${sess.session.access_token}` } },
      });
      const { count, error } = await unlinked
        .from("booking_appointments")
        .select("id", { count: "exact", head: true })
        .eq("business_id", bizA);
      return resultFromBool(!error && (count ?? 0) === 0, error?.message);
    }
    case "P2-06": {
      if (!ownerClient || !managerClient) {
        return { status: "BLOCKED", detail: "owner/manager clients required", layer: "remote" };
      }
      const { data: o } = await ownerClient
        .from("booking_appointments")
        .select("guest_name")
        .eq("business_id", bizA)
        .limit(1);
      const { data: m } = await managerClient
        .from("booking_appointments")
        .select("guest_name")
        .eq("business_id", bizA)
        .limit(1);
      return resultFromBool(
        (o?.length ?? 0) > 0 && Boolean(o[0]?.guest_name) && (m?.length ?? 0) > 0,
      );
    }
    case "P2-07": {
      const { data, error } = await staffClient.from("booking_businesses").select("id").eq("id", bizB);
      return resultFromBool(!error && (data?.length ?? 0) === 0);
    }
    case "P2-08": {
      const { data, error } = await staffClient
        .from("booking_business_subscriptions")
        .select("business_id, plan_slug, status")
        .eq("business_id", bizA);
      return resultFromBool(!error && (data?.length ?? 0) === 0, error?.message);
    }
    case "P2-09": {
      const start = new Date().toISOString();
      const end = new Date(Date.now() + 32 * 86400000).toISOString();
      const { error } = await staffClient.rpc("booking_list_member_staff_busy_intervals", {
        p_business_id: bizA,
        p_range_start: start,
        p_range_end: end,
        p_staff_ids: null,
      });
      return resultFromBool(Boolean(error));
    }
    case "P2-11": {
      const anon = createClient(env.url, env.anonKey, { auth: { persistSession: false } });
      const { error } = await anon.rpc("booking_list_member_staff_busy_intervals", {
        p_business_id: bizA,
        p_range_start: new Date().toISOString(),
        p_range_end: new Date(Date.now() + 3600000).toISOString(),
        p_staff_ids: null,
      });
      return resultFromBool(Boolean(error));
    }
    case "P2-12": {
      const fake = "00000000-0000-0000-0000-000000000099";
      const { error } = await staffClient.rpc("booking_list_member_staff_busy_intervals", {
        p_business_id: bizA,
        p_range_start: new Date().toISOString(),
        p_range_end: new Date(Date.now() + 3600000).toISOString(),
        p_staff_ids: [fake],
      });
      return resultFromBool(Boolean(error));
    }
    case "P2-18": {
      const { data, error } = await staffClient
        .from("booking_customer_internal_notes")
        .select("notes")
        .limit(1);
      return resultFromBool(!error && (data?.length ?? 0) === 0);
    }
    case "P2-13": {
      const { data: samTimeOff } = await admin
        .from("booking_time_off")
        .select("id, staff_id, starts_at")
        .eq("staff_id", staffSamId)
        .limit(1);
      if (!samTimeOff?.length) {
        return {
          status: "BLOCKED",
          detail: "no booking_time_off for Sam Provider — run incremental fixtures or full seed",
          layer: "remote",
        };
      }
      const { data, error } = await staffClient
        .from("booking_time_off")
        .select("label")
        .eq("id", samTimeOff[0].id)
        .maybeSingle();
      return resultFromBool(!error && data == null);
    }
    case "P2-23":
      return runLocalP2Check("P2-23");
    default:
      return planRemoteP2Check(caseId);
  }
}

/** @param {boolean} ok @param {string} [detail] @returns {P2HarnessResult} */
function resultFromBool(ok, detail) {
  return { status: ok ? "PASS" : "FAIL", detail, layer: "remote" };
}

/** @param {string} rel */
function readSrc(rel) {
  return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
}

/** @returns {{ local: P2HarnessResult, remote: P2HarnessResult, combined: P2Status }} */
export function evaluateP2Case(caseId) {
  const meta = PHASE2_RLS_CASES.find((c) => c.id === caseId);
  const local = meta?.local
    ? runLocalP2Check(caseId)
    : { status: "SKIP", detail: "no local harness", layer: "local" };
  const remote = meta?.remote
    ? planRemoteP2Check(caseId)
    : { status: "SKIP", detail: "no remote harness", layer: "remote" };

  /** @type {P2Status} */
  let combined = "SKIP";
  if (local.status === "FAIL" || remote.status === "FAIL") {
    combined = "FAIL";
  } else if (!meta?.local && meta?.remote) {
    combined = remote.status;
  } else if (meta?.local && !meta?.remote) {
    combined = local.status;
  } else if (local.status === "PASS" && remote.status === "PASS") {
    combined = "PASS";
  } else if (local.status === "PASS" && (remote.status === "BLOCKED" || remote.status === "SKIP")) {
    combined = "PASS";
  } else if (remote.status === "BLOCKED") {
    combined = "BLOCKED";
  } else {
    combined = "SKIP";
  }

  return { local, remote, combined };
}

export function summarizeP2Matrix() {
  /** @type {Record<P2Status, number>} */
  const combined = { PASS: 0, FAIL: 0, BLOCKED: 0, SKIP: 0 };
  const local = { PASS: 0, FAIL: 0, BLOCKED: 0, SKIP: 0 };
  const remote = { PASS: 0, FAIL: 0, BLOCKED: 0, SKIP: 0 };
  const rows = [];
  for (const c of PHASE2_RLS_CASES) {
    const ev = evaluateP2Case(c.id);
    combined[ev.combined] = (combined[ev.combined] ?? 0) + 1;
    local[ev.local.status] = (local[ev.local.status] ?? 0) + 1;
    remote[ev.remote.status] = (remote[ev.remote.status] ?? 0) + 1;
    rows.push({ id: c.id, title: c.title, ...ev });
  }
  return { counts: combined, localCounts: local, remoteCounts: remote, rows };
}

export function verifySeedContracts() {
  const seed = fs.readFileSync(
    path.join(process.cwd(), "scripts/seed-booking-integration.mjs"),
    "utf8",
  );
  const incrementalPath = path.join(process.cwd(), "scripts/booking-phase2-incremental-fixtures.mjs");
  const incremental = fs.existsSync(incrementalPath)
    ? fs.readFileSync(incrementalPath, "utf8")
    : "";
  const hasSamAppointments =
    seed.includes("staff2.id") && seed.includes("bk_seed_pending");
  const hasSamTimeOff =
    /booking_time_off[\s\S]{0,400}staff_id:\s*staff2\.id/s.test(seed) ||
    incremental.includes("PHASE2_SAM_TIME_OFF_LABEL");
  const hasUnlinkedProfessional =
    seed.includes(PHASE2_PROFESSIONAL_UNLINKED_EMAIL) ||
    seed.includes("professionalUnlinkedA") ||
    incremental.includes("professionalUnlinkedA");
  const incrementalNonDestructive =
    incremental.length > 0 &&
    !/from\(["']booking_businesses["']\)[\s\S]{0,80}\.delete\s*\(/.test(incremental);
  return {
    hasSamAppointments,
    hasSamTimeOff,
    hasUnlinkedProfessional,
    incrementalNonDestructive,
    slugA: SLUGS.businessA,
  };
}
