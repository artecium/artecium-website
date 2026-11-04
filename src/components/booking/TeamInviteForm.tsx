"use client";

import { createBookingMemberInvite } from "@/lib/actions/booking/team";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

export function TeamInviteForm() {
  const t = useTranslations("booking.team");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const professionalLabel =
    locale === "pt-PT" || locale.startsWith("pt") ? "Profissional" : "Professional";
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="max-w-lg space-y-4">
      <form
        className="space-y-3 rounded-2xl border border-[#1E293B] bg-[#0E1324]/60 p-6"
        action={(fd) => {
          setError(null);
          setInviteLink(null);
          startTransition(async () => {
            const result = await createBookingMemberInvite(fd);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            if (result.inviteLink) setInviteLink(result.inviteLink);
          });
        }}
      >
        {error ? (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}
        <div>
          <label className="mb-1 block text-sm text-[#94A3B8]" htmlFor="email">
            {tCommon("email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[#94A3B8]" htmlFor="role">
            {t("role")}
          </label>
          <select
            id="role"
            name="role"
            defaultValue="professional"
            className="w-full rounded-lg border border-[#1E293B] bg-[#050816] px-3 py-2 text-white"
          >
            <option value="professional">{professionalLabel}</option>
            <option value="manager">{t("roleManager")}</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white"
        >
          {pending ? tCommon("loading") : t("sendInvite")}
        </button>
      </form>
      {inviteLink ? (
        <p className="text-sm text-[#94A3B8]">
          {t("inviteCreated")}{" "}
          <code className="rounded bg-[#050816] px-2 py-1 text-violet-200">{inviteLink}</code>
        </p>
      ) : null}
      <p className="text-xs text-[#64748B]">{t("emailNote")}</p>
    </div>
  );
}
