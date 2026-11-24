"use client";

import {
  activateGa4Property,
  activateGscSite,
  disconnectGoogleIntegration,
  listGa4PropertiesForConnection,
  listGscSitesForConnection,
  syncGa4MetricsForConnection,
} from "@/lib/actions/admin/google-integrations";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { AdminListCard } from "@/components/admin/AdminListCard";
import { StatusBadge } from "@/components/platform/StatusBadge";
import { formatStatusLabel } from "@/lib/data/client-format";

const DEMO_ANALYTICS_PROPERTY_ID = "GA-DEMO-123456";

export interface AdminGoogleConnectionRow {
  id: string;
  company_id: string;
  company_name: string | null;
  display_name: string | null;
  property_id?: string | null;
  site_url?: string | null;
  status: string;
  connected_at: string | null;
  last_sync_at: string | null;
}

interface GoogleIntegrationConnectionCardProps {
  kind: "analytics" | "seo";
  connection: AdminGoogleConnectionRow;
  flashConnectionId?: string | null;
}

export function GoogleIntegrationConnectionCard({
  kind,
  connection,
  flashConnectionId,
}: GoogleIntegrationConnectionCardProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<
    Array<{ id: string; label: string; meta?: string }>
  >([]);
  const [selected, setSelected] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [displayLastSyncAt, setDisplayLastSyncAt] = useState(connection.last_sync_at);
  const [pending, startTransition] = useTransition();

  const needsProperty =
    connection.status === "pending_property" || connection.status === "authorizing";
  const isFocused = flashConnectionId === connection.id;
  const canSyncGa4 =
    kind === "analytics" &&
    connection.status === "active" &&
    Boolean(connection.property_id?.trim()) &&
    connection.property_id !== DEMO_ANALYTICS_PROPERTY_ID;

  const busy = pending || loadingOptions || syncing;

  const loadOptions = useCallback(async () => {
    if (!needsProperty) return;
    setError(null);
    setMessage(null);
    setLoadingOptions(true);
    try {
      if (kind === "analytics") {
        const result = await listGa4PropertiesForConnection(connection.id);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setOptions(
          result.data.map((p) => ({
            id: p.propertyId,
            label: p.displayName,
            meta: `${p.accountName} · ${p.propertyId}`,
          })),
        );
        if (result.data.length === 0) {
          setError(
            "No GA4 properties returned for this Google account. Confirm property access in Google Analytics.",
          );
        }
        return;
      }

      const result = await listGscSitesForConnection(connection.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOptions(
        result.data.map((s) => ({
          id: s.siteUrl,
          label: s.siteUrl,
          meta: s.permissionLevel ?? undefined,
        })),
      );
      if (result.data.length === 0) {
        setError("No Search Console sites returned for this Google account.");
      }
    } finally {
      setLoadingOptions(false);
    }
  }, [connection.id, kind, needsProperty]);

  const runSync = useCallback(async () => {
    if (!canSyncGa4 || syncing) return;
    setError(null);
    setMessage(null);
    setSyncing(true);
    try {
      const result = await syncGa4MetricsForConnection(connection.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const syncedAt = new Date(result.data.lastSyncAt).toLocaleString();
      setDisplayLastSyncAt(result.data.lastSyncAt);
      if (result.data.daysSynced === 0) {
        setMessage(
          `Sync completed with no daily rows from Google for the last 28 days (last sync ${syncedAt}). Existing stored metrics were not removed.`,
        );
      } else {
        setMessage(
          `Synced ${result.data.daysSynced} day(s) of GA4 metrics. Last sync ${syncedAt}.`,
        );
      }
      router.refresh();
    } finally {
      setSyncing(false);
    }
  }, [canSyncGa4, connection.id, router, syncing]);

  const title =
    connection.display_name ??
    connection.property_id ??
    connection.site_url ??
    (kind === "analytics" ? "Google Analytics" : "Search Console");

  return (
    <div
      className={`rounded-xl border p-4 ${
        isFocused ? "border-[#2563EB]/60 bg-[#0E1324]" : "border-[#1E293B] bg-[#0A0F1E]"
      }`}
    >
      <AdminListCard
        title={title}
        subtitle={connection.company_name ?? connection.company_id}
        meta={<StatusBadge label={formatStatusLabel(connection.status)} />}
      />

      <dl className="mt-3 grid gap-1 text-xs text-[#94A3B8] sm:grid-cols-2">
        <div>
          <dt className="text-[#64748B]">Connected</dt>
          <dd>{connection.connected_at ? new Date(connection.connected_at).toLocaleString() : "—"}</dd>
        </div>
        <div>
          <dt className="text-[#64748B]">Last sync</dt>
          <dd>
            {displayLastSyncAt
              ? new Date(displayLastSyncAt).toLocaleString()
              : "Not synced yet"}
          </dd>
        </div>
      </dl>

      {canSyncGa4 ? (
        <div className="mt-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => void runSync()}
            className="rounded-full bg-[#2563EB] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {syncing ? "Syncing…" : "Sync now"}
          </button>
        </div>
      ) : null}

      {needsProperty ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-[#94A3B8]">
            Google account authorized. Select the {kind === "analytics" ? "GA4 property" : "Search Console site"} for this client.
            {isFocused ? " Load the list below to finish setup." : null}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void loadOptions()}
            className="rounded-full border border-[#1E293B] px-3 py-1.5 text-sm text-[#94A3B8] hover:border-[#2563EB]/40 disabled:opacity-50"
          >
            {loadingOptions
              ? "Loading…"
              : `Load authorized ${kind === "analytics" ? "properties" : "sites"}`}
          </button>
          {options.length ? (
            <form
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                if (!selected) return;
                setMessage(null);
                setError(null);
                startTransition(async () => {
                  const picked = options.find((o) => o.id === selected);
                  const result =
                    kind === "analytics"
                      ? await activateGa4Property(
                          connection.id,
                          selected,
                          picked?.label ?? selected,
                        )
                      : await activateGscSite(connection.id, selected);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setMessage(
                    kind === "analytics" ? "GA4 property activated." : "Search Console site activated.",
                  );
                  router.refresh();
                });
              }}
            >
              <label className="flex-1 text-sm text-[#94A3B8]">
                Selection
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
                >
                  <option value="">Choose…</option>
                  {options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                      {o.meta ? ` (${o.meta})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={busy || !selected}
                className="rounded-full bg-[#2563EB] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Activate
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      {connection.status === "active" || connection.status === "pending_property" ? (
        <div className="mt-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (!window.confirm("Disconnect this Google integration for the client?")) return;
              startTransition(async () => {
                const result = await disconnectGoogleIntegration(connection.id, kind);
                if (!result.ok) setError(result.error);
                else {
                  setMessage("Integration disconnected.");
                  router.refresh();
                }
              });
            }}
            className="text-sm text-red-300 hover:underline disabled:opacity-50"
          >
            Disconnect Google
          </button>
        </div>
      ) : null}

      {message ? <p className="mt-2 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
