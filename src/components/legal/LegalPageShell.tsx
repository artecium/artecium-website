import { Footer } from "@/components/home/Footer";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LegalNavbar } from "@/components/legal/LegalNavbar";
import { LegalStructuredData } from "@/components/legal/LegalStructuredData";
import { getLegalContent } from "@/content/legal";
import type { LegalDocumentId } from "@/content/legal/types";
import type { AppLocale } from "@/i18n/config";
import { intlLocale } from "@/i18n/config";
import { getLegalPath } from "@/lib/legal/paths";

interface LegalPageShellProps {
  document: LegalDocumentId;
  locale: AppLocale;
  labels: {
    home: string;
    language: string;
    alternateLanguage: string;
  };
}

export function LegalPageShell({ document, locale, labels }: LegalPageShellProps) {
  const content = getLegalContent(document, locale);
  const path = getLegalPath(document, locale);
  const homePath = locale === "en" ? "/en" : "/";

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#050816] font-sans text-white">
      <LegalStructuredData
        path={path}
        pageName={content.title}
        pageDescription={content.description}
        inLanguage={intlLocale(locale)}
        breadcrumbItems={[
          { name: labels.home, path: homePath },
          { name: content.title, path },
        ]}
      />
      <LegalNavbar
        locale={locale}
        document={document}
        homeLabel={labels.home}
        languageLabel={labels.language}
        alternateLanguageLabel={labels.alternateLanguage}
      />
      <main id="main-content" className="flex-1 px-6 py-12 sm:px-10 sm:py-16 lg:py-20">
        <LegalDocument content={content} />
      </main>
      <Footer locale={locale} />
    </div>
  );
}
