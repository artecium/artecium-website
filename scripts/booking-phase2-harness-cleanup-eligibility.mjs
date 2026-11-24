/**
 * Mirrors phase2_harness.internal_note_blocks_customer_delete (migration 023).
 * Used by static verification; not a substitute for PostgreSQL tests.
 */

/**
 * @param {{ notes?: string | null }} [noteRow]
 * @param {boolean} noteTrackedThisRun
 * @returns {boolean} true when customer delete must be blocked
 */
export function internalNoteBlocksCustomerDelete(noteRow, noteTrackedThisRun) {
  if (noteRow == null) return false;
  const notes = noteRow.notes;
  if (notes == null) return true;
  if (!String(notes).startsWith("phase2-")) return true;
  if (!noteTrackedThisRun) return true;
  return false;
}

/**
 * @param {{ id: string, email: string, business_id: string, notes?: string | null }} customer
 * @param {string} customerId
 * @param {Set<string>} customersCreated
 * @param {Set<string>} notesCreated
 * @param {string} expectedEmail
 * @param {string} expectedBusinessId
 */
export function isCustomerDeleteEligibleForHarness(customer, customerId, customersCreated, notesCreated, expectedEmail, expectedBusinessId) {
  if (!customersCreated.has(customerId)) return false;
  if (String(customer.email).toLowerCase() !== expectedEmail.toLowerCase()) return false;
  if (String(customer.business_id) !== expectedBusinessId) return false;
  if (!String(customer.email).toLowerCase().includes("phase2-notes-fixture")) return false;

  const hasNoteRow =
    customer.notes !== undefined && customer.notes !== null ? true : customer.internalNoteRow === true;

  if (!hasNoteRow) return true;

  return !internalNoteBlocksCustomerDelete(
    { notes: customer.notes ?? null },
    notesCreated.has(customerId),
  );
}
