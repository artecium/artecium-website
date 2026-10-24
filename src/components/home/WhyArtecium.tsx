import { MarqueeLogoScroller } from "@/components/ui/marquee-logo-scroller";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { technologies } from "@/data/technologies";
import { getTranslations } from "next-intl/server";

const featureKeys = [
  "customSolutions",
  "directCommunication",
  "modernTech",
  "builtToGrow",
] as const;

export async function WhyArtecium() {
  const tWhy = await getTranslations("home.why");
  const tTrust = await getTranslations("home.trust");
  const tTech = await getTranslations("home.technologies");

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="border-t border-[#1E293B]/60 bg-[#0E1324]/30 px-6 py-24 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={tWhy("eyebrow")}
          title={tWhy("title")}
          description={tWhy("description")}
          titleId="about-heading"
        />

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-[#2563EB]/20 bg-[#0E1324]/60 p-8 text-center sm:p-10">
          <h3 className="text-xl font-semibold text-white sm:text-2xl">
            {tTrust("title")}
          </h3>
          <p className="mt-4 text-base leading-relaxed text-[#94A3B8]">
            {tTrust("description")}
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featureKeys.map((key) => (
            <article
              key={key}
              className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6 transition-all duration-300 hover:border-[#2563EB]/30 sm:p-8"
            >
              <h3 className="text-base font-semibold text-white sm:text-lg">
                {tWhy(`items.${key}.title`)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#94A3B8]">
                {tWhy(`items.${key}.description`)}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-20 border-t border-[#1E293B]/60 pt-16">
          <MarqueeLogoScroller
            eyebrow={tTech("eyebrow")}
            title={tTech("title")}
            description={tTech("description")}
            logos={technologies}
            speed="normal"
            titleId="trusted-technologies-heading"
          />
        </div>
      </div>
    </section>
  );
}
