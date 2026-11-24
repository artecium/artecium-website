/**
 * Single-process lock for booking integration seed (local file, no remote I/O).
 */
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const LOCK_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "..", ".booking-seed.lock");

/** Throws if another live seed process holds the lock. Clears stale locks. */
export function acquireBookingSeedLock() {
  if (existsSync(LOCK_PATH)) {
    const raw = readFileSync(LOCK_PATH, "utf8").trim();
    const pid = Number.parseInt(raw, 10);
    if (Number.isFinite(pid) && pid > 0) {
      try {
        process.kill(pid, 0);
        throw new Error(
          `Booking seed already running (pid ${pid}). Wait for completion or remove stale ${LOCK_PATH}.`,
        );
      } catch (err) {
        if (/** @type {NodeJS.ErrnoException} */ (err).code !== "ESRCH") {
          throw err;
        }
      }
    }
    try {
      unlinkSync(LOCK_PATH);
    } catch {
      /* ignore */
    }
  }

  writeFileSync(LOCK_PATH, String(process.pid), "utf8");

  const release = () => {
    try {
      if (existsSync(LOCK_PATH) && readFileSync(LOCK_PATH, "utf8").trim() === String(process.pid)) {
        unlinkSync(LOCK_PATH);
      }
    } catch {
      /* ignore */
    }
  };

  process.on("exit", release);
  process.on("SIGINT", () => {
    release();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    release();
    process.exit(143);
  });
}