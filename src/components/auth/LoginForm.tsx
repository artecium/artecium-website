"use client";

import {
  fetchUserRolesFromSupabase,
  resolveIsStaffFromSupabase,
} from "@/lib/auth/profile-roles";
import {
  getPostLoginPath,
  resolveClientPostLoginRedirect,
} from "@/lib/auth/redirects";
import { hasAnyStaffRole } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface LoginFormProps {
  mode?: "client" | "admin";
}

export function LoginForm({ mode = "client" }: LoginFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(t("invalidCredentials"));
      setIsLoading(false);
      return;
    }

    if (mode === "admin") {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id ?? "";
      const roles = await fetchUserRolesFromSupabase(supabase, userId);
      const isStaff =
        hasAnyStaffRole(roles) ||
        (await resolveIsStaffFromSupabase(supabase, userId));

      if (!isStaff) {
        await supabase.auth.signOut();
        setError(t("adminAccessDenied"));
        setIsLoading(false);
        return;
      }

      router.push(
        hasAnyStaffRole(roles) ? getPostLoginPath(roles) : "/admin/dashboard",
      );
      router.refresh();
      return;
    }

    const redirectPath = await resolveClientPostLoginRedirect();
    router.push(redirectPath);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-white">
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isLoading}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("emailPlaceholder")}
          className="h-12 w-full rounded-xl border border-[#1E293B] bg-[#050816] px-4 text-sm text-white placeholder:text-[#64748B] transition-colors duration-200 focus:border-[#2563EB]/60 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-white"
          >
            {t("password")}
          </label>
          <a
            href="#"
            className="text-sm text-[#94A3B8] transition-colors duration-200 hover:text-[#2563EB]"
          >
            {t("forgotPassword")}
          </a>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={isLoading}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t("passwordPlaceholder")}
          className="h-12 w-full rounded-xl border border-[#1E293B] bg-[#050816] px-4 text-sm text-white placeholder:text-[#64748B] transition-colors duration-200 focus:border-[#2563EB]/60 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#2563EB] text-sm font-medium text-white transition-all duration-300 hover:bg-[#1D4ED8] hover:shadow-[0_0_32px_rgba(37,99,235,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? t("signingIn") : t("signIn")}
      </button>
    </form>
  );
}
