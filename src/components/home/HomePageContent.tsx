import { Navbar } from "@/components/Navbar";
import { WizardRoot } from "@/components/contact/WizardRoot";
import { HomeStructuredData } from "@/components/home/HomeStructuredData";
import { ClientAreaShowcase } from "@/components/home/client-area-showcase";
import { ProductEntryLinks } from "@/components/home/ProductEntryLinks";
import { CTA } from "@/components/home/CTA";
import { Footer } from "@/components/home/Footer";
import { Hero } from "@/components/home/Hero";
import { HomeFaq } from "@/components/home/HomeFaq";
import { Services } from "@/components/home/Services";
import { marketing } from "@/lib/ui/marketing-classes";
import type { AppLocale } from "@/i18n/config";

interface HomePageContentProps {
  locale?: AppLocale;
  pageName: string;
  pageDescription: string;
}

export function HomePageContent({
  locale = "pt-PT",
  pageName,
  pageDescription,
}: HomePageContentProps) {
  return (
    <WizardRoot>
      <div className={`flex min-h-full flex-1 flex-col ${marketing.page}`}>
        <HomeStructuredData
          locale={locale}
          pageName={pageName}
          pageDescription={pageDescription}
        />
        <Navbar />
        <main id="main-content">
          <Hero />
          <Services />
          <ProductEntryLinks locale={locale} />
          <ClientAreaShowcase />
          <HomeFaq />
          <CTA />
        </main>
        <Footer locale={locale} />
      </div>
    </WizardRoot>
  );
}