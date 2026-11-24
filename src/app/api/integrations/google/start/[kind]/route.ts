import { AccessDeniedError } from "@/lib/auth/resource-access";
import { parseIntegrationFromPath } from "@/lib/google/config";
import { requireStaffForGoogleStart } from "@/lib/google/access-control";
import { ensureAuthorizingConnection } from "@/lib/google/connections";
import { buildGoogleAuthorizationUrl } from "@/lib/google/oauth-client";
import { createOAuthAuthorizationState } from "@/lib/google/oauth-state";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ kind: string }> },
) {
  const { kind: kindSegment } = await context.params;
  const integration = parseIntegrationFromPath(kindSegment);
  if (!integration) {
    return NextResponse.json({ error: "Unknown integration." }, { status: 404 });
  }

  const url = new URL(request.url);
  const companyId = url.searchParams.get("companyId")?.trim() ?? "";
  const returnPath = url.searchParams.get("returnPath")?.trim() || null;

  if (!isValidUuid(companyId)) {
    return NextResponse.json({ error: "Invalid company." }, { status: 400 });
  }

  try {
    const session = await requireStaffForGoogleStart(integration, companyId);
    const connectionId = await ensureAuthorizingConnection(companyId, integration);
    const state = await createOAuthAuthorizationState({
      integration,
      companyId,
      initiatorUserId: session.user.id,
      initiatorContext: "staff",
      connectionId,
      returnPath,
    });

    const authorizeUrl = buildGoogleAuthorizationUrl(integration, state);
    return NextResponse.redirect(authorizeUrl);
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Unable to start OAuth.";
    console.error("[google-oauth:start]", message);
    return NextResponse.json({ error: "Unable to start Google authorization." }, { status: 500 });
  }
}
