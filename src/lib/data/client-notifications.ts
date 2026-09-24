import {
  type DataFetchResult,
  fromQueryResult,
  skippedFetchResult,
} from "@/lib/data/supabase-query";
import { createClient } from "@/lib/supabase/server";

export interface ClientNotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  category: string | null;
  read_at: string | null;
  created_at: string;
}

export async function getClientNotifications(
  userId: string,
): Promise<DataFetchResult<ClientNotificationRow[]>> {
  if (!userId) {
    return skippedFetchResult([], "getClientNotifications requires userId");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, category, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return fromQueryResult("client-notifications.getClientNotifications", null, error, []);
  }

  const notifications = (data ?? []).map((row) => ({
    id: row.id as string,
    type: row.type as string,
    title: row.title as string,
    body: (row.body as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    read_at: (row.read_at as string | null) ?? null,
    created_at: row.created_at as string,
  }));

  return fromQueryResult(
    "client-notifications.getClientNotifications",
    notifications,
    null,
    [],
  );
}
