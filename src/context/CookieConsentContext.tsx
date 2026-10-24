"use client";

import {
  acceptAllConsent,
  type CookieConsent,
  type CookieConsentInput,
  getConsentFromDocument,
  rejectOptionalConsent,
  setConsentCookie,
} from "@/lib/cookies/consent";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface CookieConsentContextValue {
  consent: CookieConsent | null;
  hasChosen: boolean;
  showBanner: boolean;
  showPreferences: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  acceptAll: () => void;
  rejectOptional: () => void;
  savePreferences: (input: CookieConsentInput) => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function buildPreferencesConsent(input: CookieConsentInput): CookieConsent {
  return {
    necessary: true,
    preferences: input.preferences,
    analytics: input.analytics,
    marketing: input.marketing,
  };
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [hasChosen, setHasChosen] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = getConsentFromDocument();

    if (stored) {
      setConsent(stored);
      setHasChosen(true);
      setShowBanner(false);
    } else {
      setShowBanner(true);
    }

    setHydrated(true);
  }, []);

  const persistConsent = useCallback((next: CookieConsent) => {
    setConsentCookie(next);
    setConsent(next);
    setHasChosen(true);
    setShowBanner(false);
    setShowPreferences(false);
  }, []);

  const acceptAll = useCallback(() => {
    persistConsent(acceptAllConsent());
  }, [persistConsent]);

  const rejectOptional = useCallback(() => {
    persistConsent(rejectOptionalConsent());
  }, [persistConsent]);

  const savePreferences = useCallback(
    (input: CookieConsentInput) => {
      persistConsent(buildPreferencesConsent(input));
    },
    [persistConsent],
  );

  const openPreferences = useCallback(() => {
    setShowPreferences(true);
  }, []);

  const closePreferences = useCallback(() => {
    setShowPreferences(false);
  }, []);

  const value = useMemo(
    () => ({
      consent: hydrated ? consent : null,
      hasChosen: hydrated ? hasChosen : false,
      showBanner: hydrated ? showBanner : false,
      showPreferences,
      openPreferences,
      closePreferences,
      acceptAll,
      rejectOptional,
      savePreferences,
    }),
    [
      acceptAll,
      closePreferences,
      consent,
      hasChosen,
      hydrated,
      openPreferences,
      rejectOptional,
      savePreferences,
      showBanner,
      showPreferences,
    ],
  );

  return (
    <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);

  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }

  return context;
}
