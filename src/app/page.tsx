import { Navbar } from "@/components/Navbar";
import { CTA } from "@/components/home/CTA";
import { Footer } from "@/components/home/Footer";
import { Hero } from "@/components/home/Hero";
import { Services } from "@/components/home/Services";
import { TrustedTechnologies } from "@/components/home/TrustedTechnologies";
import { WhyArtecium } from "@/components/home/WhyArtecium";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#050816] font-sans text-white">
      <Navbar />
      <main>
        <Hero />
        <TrustedTechnologies />
        <Services />
        <WhyArtecium />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
