/**
 * Booking form-data parsing helpers.
 * Usage: node --experimental-strip-types scripts/verify-booking-form-data.mjs
 */

import {
  readFormCheckbox,
  readFormCheckboxWithDefault,
} from "../src/lib/booking/form-data.ts";

/** @typedef {{ name: string; pass: boolean; detail?: string }} Check */
/** @type {Check[]} */
const results = [];

function check(name, pass, detail) {
  results.push({ name, pass, detail });
}

const fdChecked = new FormData();
fdChecked.set("is_active", "true");
const fdUnchecked = new FormData();

check("checkbox checked", readFormCheckbox(fdChecked, "is_active") === true);
check("checkbox absent", readFormCheckbox(fdUnchecked, "is_active") === false);
check(
  "create default active",
  readFormCheckboxWithDefault(fdUnchecked, "is_active", true) === true,
);
const fdExplicitOff = new FormData();
fdExplicitOff.set("is_active", "false");
check(
  "update unchecked",
  readFormCheckbox(fdExplicitOff, "is_active") === false,
);

const passed = results.filter((r) => r.pass).length;
for (const r of results) {
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
}
console.log(`\n${passed}/${results.length} checks passed`);
if (passed !== results.length) process.exit(1);