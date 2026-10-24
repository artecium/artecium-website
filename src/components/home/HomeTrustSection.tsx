import { getTranslations } from "next-intl/server";

export async function HomeTrustSection() {
  const t = await getTranslations("home.trust");

  return (
    <section
      aria-labelledby="trust-heading"
      className="px-6 py-16 sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#1E293B] bg-[#0E1324]/60 p-8 text-center sm:p-10">
        <h2
          id="trust-heading"
          className="text-xl font-semibold text-white sm:text-2xl"
        >
          {t("title")}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[#94A3B8]">
          {t("description")}
        </p>
      </div>
    </section>
  );
}
