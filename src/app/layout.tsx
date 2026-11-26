import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { CookieConsentRoot } from "@/components/cookies/CookieConsentRoot";
import { DocumentLangScript } from "@/components/i18n/DocumentLangScript";
import { StructuredData } from "@/components/seo/StructuredData";
import { mergeHomePricingMessages } from "@/lib/i18n/merge-home-pricing";
import { resolveRequestLocale } from "@/lib/i18n/resolve-locale";
import { SITE_URL } from "@/config/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [{ url: "/artecium-logo.png", type: "image/png" }],
    apple: [{ url: "/artecium-logo.png", type: "image/png" }],
    shortcut: ["/artecium-logo.png"],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#050816",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await resolveRequestLocale();
  const baseMessages =
    locale === "en"
      ? (await import("@/i18n/messages/en.json")).default
      : (await import("@/i18n/messages/pt-PT.json")).default;
  const messages = await mergeHomePricingMessages(locale, baseMessages);
  const htmlLang = locale === "en" ? "en" : "pt-PT";

  return (
    <html
      lang={htmlLang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DocumentLangScript />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CookieConsentRoot>
            <StructuredData />
            {children}
          </CookieConsentRoot>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
