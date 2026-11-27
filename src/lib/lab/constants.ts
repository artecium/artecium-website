/** Supabase Production — never for prototype/staging write tests without explicit prod flags. */
export const ARTECIUM_SUPABASE_PRODUCTION_REF = "bwxhdoxesqtdqwkxrmom";

/** Supabase Sandbox — staging integration target. */
export const ARTECIUM_SUPABASE_SANDBOX_REF = "ahbtpmlrzruwtfcichlg";

export const ARTECIUM_RUNTIME_ENV = "ARTECIUM_RUNTIME";
export const ARTECIUM_LAB_ENV = "ARTECIUM_LAB";
/** Exposed to client bundles for lab-only UI guards (never set on production deploy). */
export const ARTECIUM_RUNTIME_PUBLIC_ENV = "NEXT_PUBLIC_ARTECIUM_RUNTIME";
export const ARTECIUM_LAB_PUBLIC_ENV = "NEXT_PUBLIC_ARTECIUM_LAB";