/**
 * Static tests for booking readiness probe classification (no database).
 * Usage: npm run verify:booking-readiness-probes
 */

import {
  BOOKING_RPC_CHECKS,
  classifyRpcProbeResult,
  isInvalidRpcArguments,
  isMissingRpc,
  isPermissionDenied,
} from "./booking-readiness-lib.mjs";

let passed = 0;
let failed = 0;

function pass(msg) {
  passed += 1;
  console.log(`PASS  ${msg}`);
}

function fail(msg) {
  failed += 1;
  console.error(`FAIL  ${msg}`);
}

function main() {
  if (isPermissionDenied({ code: "42501", message: "permission denied for table x" })) {
    pass("isPermissionDenied — 42501");
  } else fail("isPermissionDenied — 42501");

  if (!isMissingRpc({ code: "42501", message: "permission denied" })) {
    pass("isMissingRpc — not permission denied");
  } else fail("isMissingRpc — not permission denied");

  if (
    isMissingRpc({
      message: "Could not find the function public.booking_validate_public_slot without parameters",
    })
  ) {
    pass("isMissingRpc — without parameters");
  } else fail("isMissingRpc — without parameters");

  const perm = classifyRpcProbeResult(
    { code: "42501", message: "permission denied for function f" },
    {},
  );
  if (perm.outcome === "permission_denied" && perm.status === "error") {
    pass("classifyRpcProbeResult — permission_denied");
  } else fail("classifyRpcProbeResult — permission_denied");

  const validation = classifyRpcProbeResult(
    { code: "P0002", message: "business not found" },
    { expectValidationFailure: true },
  );
  if (validation.outcome === "ok_validation" && validation.status === "ok") {
    pass("classifyRpcProbeResult — validation failure ok");
  } else fail("classifyRpcProbeResult — validation failure ok");

  const slotCheck = BOOKING_RPC_CHECKS.find((c) => c.fn === "booking_validate_public_slot");
  if (slotCheck && slotCheck.args.p_business_id && slotCheck.clientRole === "anon") {
    pass("booking_validate_public_slot — args and anon client");
  } else fail("booking_validate_public_slot — args and anon client");

  const hashCheck = BOOKING_RPC_CHECKS.find((c) => c.fn === "booking_public_idempotency_request_hash");
  if (hashCheck?.clientRole === "anon" && hashCheck.expectSuccess) {
    pass("idempotency hash — anon + expectSuccess");
  } else fail("idempotency hash — anon + expectSuccess");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
