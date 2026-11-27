import {
  ARTECIUM_LAB_ENV,
  ARTECIUM_LAB_PUBLIC_ENV,
  ARTECIUM_RUNTIME_ENV,
  ARTECIUM_RUNTIME_PUBLIC_ENV,
} from "@/lib/lab/constants";

export type ArteciumRuntime = "production" | "staging" | "prototype" | "development";

const RUNTIME_VALUES = new Set<ArteciumRuntime>([
  "production",
  "staging",
  "prototype",
  "development",
]);

function readRuntimeFlag(): string | undefined {
  return (
    process.env[ARTECIUM_RUNTIME_ENV]?.trim().toLowerCase() ||
    process.env[ARTECIUM_RUNTIME_PUBLIC_ENV]?.trim().toLowerCase()
  );
}

function isLabFlagEnabled(): boolean {
  return (
    process.env[ARTECIUM_LAB_ENV] === "1" || process.env[ARTECIUM_LAB_PUBLIC_ENV] === "1"
  );
}

export function getArteciumRuntime(): ArteciumRuntime {
  const raw = readRuntimeFlag();
  if (raw && RUNTIME_VALUES.has(raw as ArteciumRuntime)) {
    return raw as ArteciumRuntime;
  }
  if (isLabFlagEnabled()) {
    return "prototype";
  }
  if (process.env.NODE_ENV === "production") {
    return "production";
  }
  return "development";
}

export function isPrototypeRuntime(): boolean {
  return getArteciumRuntime() === "prototype";
}

export function isStagingRuntime(): boolean {
  return getArteciumRuntime() === "staging";
}

export function isLabRuntime(): boolean {
  const r = getArteciumRuntime();
  return r === "prototype" || r === "staging";
}