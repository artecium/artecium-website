import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";

export default async function EnLayout({ children }: { children: ReactNode }) {
  const messages = (await import("@/i18n/messages/en.json")).default;

  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
