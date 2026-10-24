import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, resolveLocale, type AppLocale } from "./config";

async function loadMessages(locale: AppLocale) {
  switch (locale) {
    case "en":
      return (await import("./messages/en.json")).default;
    case "pt-PT":
    default:
      return (await import("./messages/pt-PT.json")).default;
  }
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const cookieLocale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const locale: AppLocale =
    pathname === "/en" || pathname.startsWith("/en/") ? "en" : cookieLocale;

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
