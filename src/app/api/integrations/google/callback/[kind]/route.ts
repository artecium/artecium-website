import { AccessDeniedError } from "@/lib/auth/resource-access";
import { assertGoogleOAuthInitiator } from "@/lib/google/access-control";
import {
  attachTokenToConnection,
  ensureAuthorizingConnection,
} from "@/lib/google/connections";
import { parseIntegrationFromPath, integrationPathSegment } from "@/lib/google/config";
import {
  exchangeGoogleAuthorizationCode,
  fetchGoogleAccountProfile,
} from "@/lib/google/oauth-client";
import { OAuthStateError, consumeOAuthAuthorizationState } from "@/lib/google/oauth-state";
import { upsertGoogleOAuthToken } from "@/lib/google/token-store";
import { getAppBaseUrl } from "@/lib/stripe/app-url";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function adminRedirect(
  integrationSegment: string,
  params: Record<string, string>,
): NextResponse {
  const target = new URL(`${getAppBaseUrl()}/admin/${integrationSegment === "analytics" ? "analytics" : "seo"}`);
  for (const [key, value] of Object.entries(params)) {
    target.searchParams.set(key, value);
  }
  return NextResponse.redirect(target.toString());
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
  const oauthError = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");

  if (oauthError) {
    return adminRedirect(integrationPathSegment(integration), {
      google: "denied",
    });
  }

  if (!code || !stateParam) {
    return adminRedirect(integrationPathSegment(integration), {
      google: "invalid_callback",
    });
  }

  try {
    const state = await consumeOAuthAuthorizationState(stateParam, integration);
    await assertGoogleOAuthInitiator(
      state.initiatorContext,
      integration,
      state.companyId,
      state.initiatorUserId,
    );

    const tokenResponse = await exchangeGoogleAuthorizationCode(integration, code);

    let googleAccountEmail: string | null = null;
    let googleAccountSub: string | null = null;
    if (tokenResponse.accessToken) {
      try {
        const profile = await fetchGoogleAccountProfile(tokenResponse.accessToken);
        googleAccountEmail = profile.email;
        googleAccountSub = profile.sub;
      } catch {
        // Profile optional — readonly product scopes may not include email.
      }
    }

    const stored = await upsertGoogleOAuthToken({
      companyId: state.companyId,
      integration,
      refreshToken: tokenResponse.refreshToken,
      accessToken: tokenResponse.accessToken,
      accessTokenExpiresAt: tokenResponse.expiresAt,
      scopes: tokenResponse.scopes,
      googleAccountEmail,
      googleAccountSub,
    });

    const connectionId =
      state.connectionId ??
      (await ensureAuthorizingConnection(state.companyId, integration));

    await attachTokenToConnection(integration, connectionId, stored.id);

    if (state.returnPath && state.returnPath.startsWith("/admin/")) {
      const custom = new URL(`${getAppBaseUrl()}${state.returnPath}`);
      custom.searchParams.set("google", "connected");
      custom.searchParams.set("companyId", state.companyId);
      custom.searchParams.set("connectionId", connectionId);
      return NextResponse.redirect(custom.toString());
    }

    return adminRedirect(integrationPathSegment(integration), {
      google: "connected",
      companyId: state.companyId,
      connectionId,
    });
  } catch (error) {
    if (error instanceof OAuthStateError) {
      return adminRedirect(integrationPathSegment(integration), {
        google: error.code,
      });
    }
    if (error instanceof AccessDeniedError) {
      return adminRedirect(integrationPathSegment(integration), {
        google: "access_denied",
      });
    }
    console.error("[google-oauth:callback]", error instanceof Error ? error.message : error);
    return adminRedirect(integrationPathSegment(integration), {
      google: "error",
    });
  }
}
