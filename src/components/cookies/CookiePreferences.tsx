"use client";

import { CookieSwitch } from "@/components/cookies/CookieSwitch";
import { useCookieConsent } from "@/context/CookieConsentContext";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";

export function CookiePreferences() {
  const t = useTranslations("cookies");
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const { showPreferences, closePreferences, savePreferences, consent } = useCookieConsent();

  const [preferences, setPreferences] = useState(consent?.preferences ?? false);
  const [analytics, setAnalytics] = useState(consent?.analytics ?? false);
  const [marketing, setMarketing] = useState(consent?.marketing ?? false);

  useEffect(() => {
    if (!showPreferences) return;

    setPreferences(consent?.preferences ?? false);
    setAnalytics(consent?.analytics ?? false);
    setMarketing(consent?.marketing ?? false);
  }, [consent, showPreferences]);

  useEffect(() => {
    if (!showPreferences) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePreferences();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const elements = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const focusableElements = Array.from(elements).filter(
        (el) => !el.hasAttribute("disabled"),
      );

      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [closePreferences, showPreferences]);

  if (!showPreferences) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-[#050816]/80 backdrop-blur-xl"
        aria-label={t("closePreferences")}
        onClick={closePreferences}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0E1324]/95 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:max-h-[85vh]"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#2563EB]/[0.05] to-transparent" />

        <div className="relative border-b border-[#1E293B]/60 px-5 py-4 sm:px-6">
          <h2 id={titleId} className="text-base font-semibold text-white">
            {t("preferencesTitle")}
          </h2>
          <p id={descriptionId} className="mt-1 text-sm text-[#94A3B8]">
            {t("preferencesDescription")}
          </p>
        </div>

        <div className="relative flex-1 space-y-3 overflow-y-auto px-5 py-4 sm:px-6">
          <CategoryRow
            title={t("necessary")}
            status={t("necessaryStatus")}
            description={t("necessaryDescription")}
            switchId="cookie-necessary"
            checked
            disabled
          />
          <CategoryRow
            title={t("preferences")}
            status={t("optional")}
            description={t("preferencesDescription")}
            switchId="cookie-preferences"
            checked={preferences}
            onChange={setPreferences}
          />
          <CategoryRow
            title={t("analytics")}
            status={t("optional")}
            description={t("analyticsDescription")}
            switchId="cookie-analytics"
            checked={analytics}
            onChange={setAnalytics}
          />
          <CategoryRow
            title={t("marketing")}
            status={t("optional")}
            description={t("marketingDescription")}
            switchId="cookie-marketing"
            checked={marketing}
            onChange={setMarketing}
          />
        </div>

        <div className="relative border-t border-[#1E293B]/60 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={() =>
              savePreferences({
                preferences,
                analytics,
                marketing,
              })
            }
            className="w-full rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-[0_0_24px_rgba(37,99,235,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E1324]"
          >
            {t("savePreferences")}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CategoryRowProps {
  title: string;
  status: string;
  description: string;
  switchId: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

function CategoryRow({
  title,
  status,
  description,
  switchId,
  checked,
  disabled,
  onChange,
}: CategoryRowProps) {
  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#050816]/60 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-white">{title}</h3>
            <span className="rounded-full border border-[#1E293B] bg-[#0E1324] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#64748B]">
              {status}
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[#94A3B8]">{description}</p>
        </div>
        <CookieSwitch
          id={switchId}
          label={title}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
