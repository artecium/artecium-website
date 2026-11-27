import { AreaHub } from "@/components/auth/AreaHub";
import type { AreaHubCardId } from "@/components/auth/AreaHubPlatformCard";
import { notFound } from "next/navigation";

function parseOpenParam(open: string | string[] | undefined): AreaHubCardId | null {
  const value = Array.isArray(open) ? open[0] : open;
  if (value === "client" || value === "booking") return value;
  return null;
}

/** Localhost-only visual QA for /acesso platform cards (no auth bypass on production). */
export default async function AreaHubPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string | string[] }>;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { open } = await searchParams;
  const initialOpenId = parseOpenParam(open);

  return (
    <AreaHub
      access={{
        userId: "dev-preview",
        isStaff: false,
        hasClientPortal: true,
        hasBookingPortal: true,
      }}
      reason={null}
      homeHref="/"
      displayName="Cliente Demo"
      initialOpenId={initialOpenId}
    />
  );
}