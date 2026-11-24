"use client";

import {
  classifySignUpError,
  validateSignUpFields,
  type SignUpFieldErrors,
} from "@/lib/auth/sign-up-validation";
import {
  buildAuthCallbackUrl,
  resolveSafePostAuthPath,
} from "@/lib/auth/login-redirect";
import { redirectAfterSignUpSession } from "@/lib/auth/post-auth-client";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface SignUpFormProps {
  redirectTo?: string;
}

export function SignUpForm({ redirectTo }: SignUpFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<SignUpFieldErrors | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function fieldErrorMessage(errors: SignUpFieldErrors, key: keyof SignUpFieldErrors) {
    const code = errors[key];
    if (!code) return null;
    if (key === "email") {
      return code === "required" ? t("signUp.emailRequired") : t("signUp.emailInvalid");
    }
    if (key === "password") {
      return code === "required"
        ? t("signUp.passwordRequired")
        : t("signUp.passwordTooShort");
    }
    if (key === "confirmPassword") {
      return code === "required"
        ? t("signUp.confirmRequired")
        : t("signUp.confirmMismatch");
    }
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors(null);
    setPendingConfirmation(false);

    const validation = validateSignUpFields({
      email,
      password,
      confirmPassword,
    });
    if (validation) {
      setFieldErrors(validation);
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const emailRedirectTo = buildAuthCallbackUrl(origin, redirectTo);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo,
      },
    });

    if (signUpError) {
      const kind = classifySignUpError(
        signUpError.message,
        signUpError.code ?? signUpError.name,
      );
      const messageKey =
        kind === "signupDisabled"
          ? "signUp.errors.signupDisabled"
          : kind === "weakPassword"
            ? "signUp.errors.weakPassword"
            : kind === "invalidEmail"
              ? "signUp.errors.invalidEmail"
              : "signUp.errors.generic";
      setError(t(messageKey));
      setIsLoading(false);
      return;
    }

    if (data.session) {
      await redirectAfterSignUpSession(router, redirectTo);
      setIsLoading(false);
      return;
    }

    setPendingConfirmation(true);
    setIsLoading(false);
  }

  const inputClass =
    "h-12 w-full rounded-xl border border-[#1E293B] bg-[#050816] px-4 text-sm text-white placeholder:text-[#64748B] transition-colors duration-200 focus:border-[#2563EB]/60 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {pendingConfirmation ? (
        <div
          role="status"
          className="rounded-xl border border-[#2563EB]/30 bg-[#2563EB]/10 px-4 py-3 text-sm text-[#BFDBFE]"
        >
          <p className="font-medium text-white">{t("signUp.confirmEmailTitle")}</p>
          <p className="mt-1 text-[#94A3B8]">{t("signUp.confirmEmailDescription")}</p>
          <p className="mt-2 text-xs text-[#64748B]">
            {t("signUp.confirmEmailNextHint", {
              path: resolveSafePostAuthPath(redirectTo),
            })}
          </p>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="signup-email" className="block text-sm font-medium text-white">
          {t("email")}
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          disabled={isLoading || pendingConfirmation}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("emailPlaceholder")}
          className={`${inputClass} ${fieldErrors?.email ? "border-red-500/50" : ""}`}
          aria-invalid={Boolean(fieldErrors?.email)}
        />
        {fieldErrors?.email ? (
          <p className="text-xs text-red-300">{fieldErrorMessage(fieldErrors, "email")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="signup-password"
          className="block text-sm font-medium text-white"
        >
          {t("signUp.passwordLabel")}
        </label>
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          disabled={isLoading || pendingConfirmation}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t("signUp.passwordPlaceholder")}
          className={`${inputClass} ${fieldErrors?.password ? "border-red-500/50" : ""}`}
          aria-invalid={Boolean(fieldErrors?.password)}
        />
        {fieldErrors?.password ? (
          <p className="text-xs text-red-300">
            {fieldErrorMessage(fieldErrors, "password")}
          </p>
        ) : (
          <p className="text-xs text-[#64748B]">{t("signUp.passwordHint")}</p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="signup-confirm-password"
          className="block text-sm font-medium text-white"
        >
          {t("signUp.confirmPasswordLabel")}
        </label>
        <input
          id="signup-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          disabled={isLoading || pendingConfirmation}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder={t("signUp.confirmPasswordPlaceholder")}
          className={`${inputClass} ${fieldErrors?.confirmPassword ? "border-red-500/50" : ""}`}
          aria-invalid={Boolean(fieldErrors?.confirmPassword)}
        />
        {fieldErrors?.confirmPassword ? (
          <p className="text-xs text-red-300">
            {fieldErrorMessage(fieldErrors, "confirmPassword")}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isLoading || pendingConfirmation}
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#2563EB] text-sm font-medium text-white transition-all duration-300 hover:bg-[#1D4ED8] hover:shadow-[0_0_32px_rgba(37,99,235,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? t("signUp.submitting") : t("signUp.submit")}
      </button>
    </form>
  );
}
