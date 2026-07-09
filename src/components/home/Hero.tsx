import { HeroVisual } from "@/components/home/HeroVisual";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-16 sm:px-10 sm:pb-20 sm:pt-20 lg:px-16 lg:pb-24 lg:pt-28">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute -right-1/4 top-0 h-[600px] w-[600px] rounded-full bg-[#2563EB]/[0.04] blur-[120px] animate-glow-pulse" />
        <div className="absolute -left-1/3 bottom-0 h-[400px] w-[400px] rounded-full bg-[#0D47A1]/[0.06] blur-[100px]" />
        <div className="animate-streak-drift absolute bottom-32 right-0 h-px w-1/2 bg-gradient-to-l from-transparent via-[#2563EB]/40 to-transparent" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2 lg:gap-12">
        <div className="max-w-xl lg:max-w-none">
          <div className="animate-fade-up mb-8 inline-flex items-center gap-2.5 rounded-full border border-[#1E293B] bg-[#0E1324]/80 px-4 py-2 text-sm text-[#94A3B8] backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2563EB] opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2563EB]" />
            </span>
            AI · Software · Automation
          </div>

          <h1 className="animate-fade-up-delay-1 text-[2.75rem] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl md:text-6xl lg:text-[4.25rem]">
            Engineering the future of{" "}
            <span className="bg-gradient-to-r from-[#2563EB] to-[#60A5FA] bg-clip-text text-transparent">
              business.
            </span>
          </h1>

          <p className="animate-fade-up-delay-2 mt-7 max-w-lg text-lg leading-[1.7] text-[#94A3B8] sm:text-xl">
            We build AI-powered software, automation and digital products for
            ambitious companies ready to lead their industries.
          </p>

          <div className="animate-fade-up-delay-3 mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href="#contact"
              className="group inline-flex h-12 items-center justify-center rounded-full bg-[#2563EB] px-8 text-[0.9375rem] font-medium text-white transition-all duration-300 hover:bg-[#1D4ED8] hover:shadow-[0_0_40px_rgba(37,99,235,0.35)]"
            >
              Start a project
              <svg
                className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
            <a
              href="#services"
              className="inline-flex h-12 items-center justify-center rounded-full border border-[#1E293B] bg-[#0E1324] px-8 text-[0.9375rem] font-medium text-white transition-all duration-300 hover:border-[#334155] hover:bg-[#0E1324]/80"
            >
              Explore services
            </a>
          </div>
        </div>

        <div className="animate-fade-up-delay-2 hidden lg:block">
          <HeroVisual />
        </div>
      </div>

      <div className="relative mx-auto mt-12 max-w-7xl lg:hidden">
        <HeroVisual />
      </div>
    </section>
  );
}
