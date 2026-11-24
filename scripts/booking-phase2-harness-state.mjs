/**
 * Phase 2 harness run state machine (v2.1) — pure validation for local tests.
 */

/** @typedef {'started'|'prepared'|'tested'|'cleanup_approved'|'cleaned'|'failed'} RunStatus */
/** @typedef {'not_requested'|'pending_review'|'approved'|'rejected'|'executed'|'aborted'} CleanupStatus */

/**
 * @param {RunStatus} status
 * @param {CleanupStatus} cleanupStatus
 */
export function canCleanupPreview(status, cleanupStatus) {
  if (status === "failed" || status === "cleaned" || status === "started" || status === "prepared") {
    return false;
  }
  if (status === "cleanup_approved") return true;
  if (status === "tested") {
    return ["not_requested", "pending_review", "rejected", "aborted"].includes(cleanupStatus);
  }
  return false;
}

/** @param {RunStatus} status */
export function canCleanupApprove(status) {
  return status === "tested";
}

/** @param {RunStatus} status @param {CleanupStatus} cleanupStatus */
export function canCleanupExecute(status, cleanupStatus) {
  return status === "cleanup_approved" && cleanupStatus === "approved";
}

/** @param {RunStatus} from @param {RunStatus} to */
export function isAllowedStatusTransition(from, to) {
  const allowed = {
    started: ["prepared", "failed"],
    prepared: ["tested", "failed"],
    tested: ["cleanup_approved", "failed"],
    cleanup_approved: ["cleaned", "failed"],
    cleaned: [],
    failed: [],
  };
  return (allowed[from] ?? []).includes(to);
}
