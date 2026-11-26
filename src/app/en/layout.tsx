import { mergeHomePricingMessages } from "@/lib/i18n/merge-home-pricing";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";

export default async function EnLayout({ children }: { children: ReactNode }) {
  const baseMessages = (await import("@/i18n/messages/en.json")).default;
  const messages = await mergeHomePricingMessages("en", baseMessages);

  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
