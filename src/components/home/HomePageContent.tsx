import { Navbar } from "@/components/Navbar";
import { WizardRoot } from "@/components/contact/WizardRoot";
import { HomeStructuredData } from "@/components/home/HomeStructuredData";
import { BusinessProblems } from "@/components/home/business-problems";
import { ClientAreaShowcase } from "@/components/home/client-area-showcase";
import { CTA } from "@/components/home/CTA";
import { Footer } from "@/components/home/Footer";
import { Hero } from "@/components/home/Hero";
import { HomeFaq } from "@/components/home/HomeFaq";
import {
  PricingConversionNudge,
  ServicesConversionNudge,
} from "@/components/home/HomeMicroConversions";
import { HowWeWork } from "@/components/home/HowWeWork";
import { PricingSection } from "@/components/home/pricing-section";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { Services } from "@/components/home/Services";
import { WhyArtecium } from "@/components/home/WhyArtecium";
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
      <div className="flex min-h-full flex-1 flex-col bg-[#050816] font-sans text-white">
        <HomeStructuredData
          locale={locale}
          pageName={pageName}
          pageDescription={pageDescription}
        />
        <Navbar />
        <main id="main-content">
          <Hero />
          <BusinessProblems />
          <Services />
          <ServicesConversionNudge />
          <PricingSection />
          <PricingConversionNudge />
          <HowWeWork />
          <FeaturedProjects locale={locale} />
          <WhyArtecium />
          <HomeFaq />
          <ClientAreaShowcase />
          <CTA />
        </main>
        <Footer locale={locale} />
      </div>
    </WizardRoot>
  );
}
