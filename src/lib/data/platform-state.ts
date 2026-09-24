import { logDataQueryError } from "@/lib/data/supabase-query";
import { createClient } from "@/lib/supabase/server";
import type { EmptyDataState } from "@/types/platform";

export async function getDatabaseReadyState(): Promise<EmptyDataState> {
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").select("id").limit(1);

  if (error) {
    return {
      configured: false,
      message:
        "A base de dados ainda não está configurada. Execute a migration Supabase em supabase/migrations/001_initial_schema.sql.",
    };
  }

  return {
    configured: true,
    message: "",
  };
}

export async function getAnalyticsConnectionState(
  companyIds: string[] = [],
): Promise<EmptyDataState> {
  const db = await getDatabaseReadyState();
  if (!db.configured) return db;

  if (!companyIds.length) {
    return {
      configured: false,
      message: "Google Analytics connection status is unavailable without company context.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analytics_connections")
    .select("id, status, company_id")
    .in("company_id", companyIds)
    .eq("status", "active")
    .limit(1);

  if (error) {
    logDataQueryError("platform-state.getAnalyticsConnectionState", error);
    return {
      configured: false,
      message: "Google Analytics ainda não está ligado.",
    };
  }

  if (!data?.length) {
    return {
      configured: false,
      message: "Google Analytics ainda não está ligado.",
    };
  }

  return { configured: true, message: "" };
}

export async function getSeoConnectionState(
  companyIds: string[] = [],
): Promise<EmptyDataState> {
  const db = await getDatabaseReadyState();
  if (!db.configured) return db;

  if (!companyIds.length) {
    return {
      configured: false,
      message: "Google Search Console connection status is unavailable without company context.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seo_connections")
    .select("id, status, company_id")
    .in("company_id", companyIds)
    .eq("status", "active")
    .limit(1);

  if (error) {
    logDataQueryError("platform-state.getSeoConnectionState", error);
    return {
      configured: false,
      message: "Google Search Console ainda não está ligado.",
    };
  }

  if (!data?.length) {
    return {
      configured: false,
      message: "Google Search Console ainda não está ligado.",
    };
  }

  return { configured: true, message: "" };
}
