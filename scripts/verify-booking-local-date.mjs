import { formatLocalDateInTimezone } from "../src/lib/booking/local-date.ts";

const tz = "Europe/Lisbon";
const d = new Date("2026-06-15T23:30:00.000Z");
const local = formatLocalDateInTimezone(d, tz);
if (local === "2026-06-16" || local === "2026-06-15") {
  console.log(`PASS  formatLocalDateInTimezone — ${local}`);
} else {
  console.error(`FAIL  unexpected ${local}`);
  process.exit(1);
}
