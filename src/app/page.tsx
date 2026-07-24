import { Navbar } from "@/components/Navbar";
import { WizardRoot } from "@/components/contact/WizardRoot";
import { CTA } from "@/components/home/CTA";
import { Footer } from "@/components/home/Footer";
import { Hero } from "@/components/home/Hero";
import { Services } from "@/components/home/Services";
import { TrustedTechnologies } from "@/components/home/TrustedTechnologies";
import { WhyArtecium } from "@/components/home/WhyArtecium";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/config/seo";
import { constructMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = constructMetadata({
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  path: "/",
});

export default function Home() {
  return (
    <WizardRoot>
      <div className="flex min-h-full flex-1 flex-col bg-[#050816] font-sans text-white">
        <Navbar />
        <main id="main-content">
          <Hero />
          <TrustedTechnologies />
          <Services />
          <WhyArtecium />
          <CTA />
        </main>
        <Footer />
      </div>
    </WizardRoot>
  );
}
