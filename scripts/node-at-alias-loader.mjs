/** Resolve `@/*` to `src/*` for Node verify scripts (--experimental-strip-types). */
import { pathToFileURL } from "node:url";
import { resolve as pathResolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = pathResolve(dirname(fileURLToPath(import.meta.url)), "..", "src");

export async function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith("@/")) {
    return nextResolve(specifier, context);
  }
  const rel = specifier.slice(2);
  const base = pathResolve(SRC, rel);
  for (const candidate of [`${base}.ts`, `${base}.tsx`, pathResolve(base, "index.ts")]) {
    try {
      return await nextResolve(pathToFileURL(candidate).href, context);
    } catch {
      /* try next */
    }
  }
  return nextResolve(specifier, context);
}