"use client";

import { ClarityScript } from "@/components/analytics/ClarityScript";
import { useCookieConsent } from "@/context/CookieConsentContext";
import { GA_MEASUREMENT_ID } from "@/config/seo";
import { GoogleAnalytics } from "@next/third-parties/google";
import { useEffect } from "react";

function AnalyticsPreconnect() {
  useEffect(() => {
    const origins = ["https://www.googletagmanager.com", "https://www.clarity.ms"];

    const links = origins.flatMap((href) => {
      const preconnect = document.createElement("link");
      preconnect.rel = "preconnect";
      preconnect.href = href;

      const dnsPrefetch = document.createElement("link");
      dnsPrefetch.rel = "dns-prefetch";
      dnsPrefetch.href = href;

      return [preconnect, dnsPrefetch];
    });

    links.forEach((link) => document.head.appendChild(link));

    return () => {
      links.forEach((link) => link.remove());
    };
  }, []);

  return null;
}

export function ConsentAwareAnalytics() {
  const { consent } = useCookieConsent();

  if (!consent?.analytics) {
    return null;
  }

  return (
    <>
      <AnalyticsPreconnect />
      {GA_MEASUREMENT_ID ? <GoogleAnalytics gaId={GA_MEASUREMENT_ID} /> : null}
      <ClarityScript />
    </>
  );
}
