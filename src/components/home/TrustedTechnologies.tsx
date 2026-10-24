import { MarqueeLogoScroller } from "@/components/ui/marquee-logo-scroller";
import { technologies } from "@/data/technologies";
import { getTranslations } from "next-intl/server";

export async function TrustedTechnologies() {
  const t = await getTranslations("home.technologies");

  return (
    <section
      id="solutions"
      aria-labelledby="trusted-technologies-heading"
      className="border-y border-[#1E293B]/60 bg-[#050816] px-6 py-16 sm:px-10 sm:py-20 lg:px-16"
    >
      <div className="mx-auto max-w-7xl">
        <MarqueeLogoScroller
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
          logos={technologies}
          speed="normal"
          titleId="trusted-technologies-heading"
        />
      </div>
    </section>
  );
}
