import { createTranslator } from "next-intl";
import type { AppLocale } from "@/i18n/config";
import { intlLocale } from "@/i18n/config";

async function loadMessages(locale: AppLocale) {
  const [base, blogExtras, projectsExtras] = await Promise.all([
    locale === "en"
      ? import("@/i18n/messages/en.json")
      : import("@/i18n/messages/pt-PT.json"),
    locale === "en"
      ? import("@/i18n/messages/blog-articles/en.json")
      : import("@/i18n/messages/blog-articles/pt.json"),
    locale === "en"
      ? import("@/i18n/messages/projects/en.json")
      : import("@/i18n/messages/projects/pt.json"),
  ]);

  return {
    ...base.default,
    blog: {
      ...base.default.blog,
      ...blogExtras.default.blog,
      shared: {
        ...base.default.blog?.shared,
        ...blogExtras.default.blog?.shared,
      },
      articles: {
        ...base.default.blog?.articles,
        ...blogExtras.default.blog?.articles,
      },
    },
    projects: {
      ...projectsExtras.default.projects,
    },
  };
}

export async function getTranslationsForLocale(
  locale: AppLocale,
  namespace: string,
) {
  const messages = await loadMessages(locale);

  return createTranslator({
    locale: intlLocale(locale),
    messages,
    namespace,
  } as Parameters<typeof createTranslator>[0]);
}
