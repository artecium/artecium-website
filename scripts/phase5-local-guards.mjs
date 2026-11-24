/**
 * @deprecated Use phase5-isolation-guards.mjs (local + allowlisted sandbox).
 */
export {
  PROTECTED_AUDIT_REF,
  assertPhase5IsolationTarget as assertPhase5LocalTarget,
  assertPhase5IsolationTarget,
  isLocalSupabaseUrl,
  extractSupabaseProjectRef,
  phase5ProtectedRef,
} from "./phase5-isolation-guards.mjs";