"use client";

import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

type AuthMode = "signIn" | "signUp";

interface ClientAuthPanelProps {
  redirectTo?: string;
  initialMode?: AuthMode;
  authCallbackError?: boolean;
}

export function ClientAuthPanel({
  redirectTo,
  initialMode = "signIn",
  authCallbackError = false,
}: ClientAuthPanelProps) {
  const t = useTranslations("auth");
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const switchMode = useCallback((next: AuthMode) => {
    setMode(next);
  }, []);

  return (
    <>
      {authCallbackError ? (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {t("signUp.errors.authCallback")}
        </div>
      ) : null}

      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {mode === "signIn" ? t("clientLogin") : t("signUp.title")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#94A3B8] sm:text-base">
          {mode === "signIn" ? t("accessClientArea") : t("signUp.subtitle")}
        </p>
      </div>

      <GoogleOAuthButton redirectTo={redirectTo} />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-[#1E293B]" />
        </div>
        <p className="relative mx-auto w-fit bg-[#0E1324] px-3 text-xs uppercase tracking-wider text-[#64748B]">
          {t("orDivider")}
        </p>
      </div>

      {mode === "signIn" ? (
        <LoginForm redirectTo={redirectTo} />
      ) : (
        <SignUpForm redirectTo={redirectTo} />
      )}

      <p className="mt-6 text-center text-sm text-[#94A3B8]">
        {mode === "signIn" ? (
          <>
            {t("signUp.noAccount")}{" "}
            <button
              type="button"
              onClick={() => switchMode("signUp")}
              className="font-medium text-[#2563EB] transition-colors hover:text-[#1D4ED8] hover:underline"
            >
              {t("signUp.createAccount")}
            </button>
          </>
        ) : (
          <>
            {t("signUp.hasAccount")}{" "}
            <button
              type="button"
              onClick={() => switchMode("signIn")}
              className="font-medium text-[#2563EB] transition-colors hover:text-[#1D4ED8] hover:underline"
            >
              {t("signIn")}
            </button>
          </>
        )}
      </p>
    </>
  );
}
