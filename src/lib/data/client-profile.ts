import {
  type DataFetchResult,
  fromQueryResult,
  skippedFetchResult,
} from "@/lib/data/supabase-query";
import { createClient } from "@/lib/supabase/server";
import type { PlatformProfile } from "@/types/platform";

export interface ClientCompanyRow {
  id: string;
  name: string;
  tax_id: string | null;
}

export interface ClientProfileContext {
  profile: PlatformProfile;
  companies: ClientCompanyRow[];
}

export async function getClientProfileContext(
  profile: PlatformProfile,
): Promise<DataFetchResult<ClientProfileContext>> {
  if (!profile.company_ids.length) {
    return skippedFetchResult(
      { profile, companies: [] },
      "getClientProfileContext requires companyIds",
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, tax_id")
    .in("id", profile.company_ids)
    .order("name", { ascending: true });

  if (error) {
    return fromQueryResult(
      "client-profile.getClientProfileContext",
      null,
      error,
      { profile, companies: [] },
    );
  }

  const companies = (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    tax_id: (row.tax_id as string | null) ?? null,
  }));

  return fromQueryResult(
    "client-profile.getClientProfileContext",
    { profile, companies },
    null,
    { profile, companies: [] },
  );
}
