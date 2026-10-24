import { StartProjectButton } from "@/components/contact/StartProjectButton";

interface WebsitesPlanCardProps {
  name: string;
  price: string;
  priceNote?: string;
  description: string;
  features: string[];
  cta: string;
  featured?: boolean;
  badge?: string;
  popularBadge?: string;
}

export function WebsitesPlanCard({
  name,
  price,
  priceNote,
  description,
  features,
  cta,
  featured = false,
  badge,
  popularBadge,
}: WebsitesPlanCardProps) {
  const displayBadge = badge ?? (featured ? popularBadge : undefined);
  return (
    <article
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl border bg-[#0E1324]/80 p-8 backdrop-blur-sm transition-all duration-300 ${
        featured
          ? "border-[#2563EB]/40 shadow-[0_8px_48px_rgba(37,99,235,0.12)] lg:-translate-y-1"
          : "border-[#1E293B] hover:border-[#2563EB]/25 hover:shadow-[0_8px_40px_rgba(37,99,235,0.08)]"
      }`}
    >
      {featured ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2563EB]/60 to-transparent"
          aria-hidden="true"
        />
      ) : null}

      {displayBadge ? (
        <span className="mb-5 inline-flex w-fit rounded-full border border-[#2563EB]/30 bg-[#2563EB]/10 px-3 py-1 text-[0.6875rem] font-semibold tracking-[0.14em] text-[#60A5FA] uppercase">
          {displayBadge}
        </span>
      ) : (
        <span className="mb-5 block h-[1.625rem]" aria-hidden="true" />
      )}

      <h3 className="text-lg font-semibold text-white">{name}</h3>

      <p className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
        {price}
      </p>

      {priceNote ? (
        <p className="mt-2 text-xs font-medium tracking-wide text-[#64748B] uppercase">
          {priceNote}
        </p>
      ) : null}

      <p className="mt-4 text-sm leading-relaxed text-[#94A3B8]">{description}</p>

      <ul className="mt-6 flex-1 space-y-3">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2.5 text-sm text-[#94A3B8]"
          >
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <StartProjectButton
        variant={featured ? "primary" : "secondary"}
        className="mt-8 w-full"
      >
        {cta}
      </StartProjectButton>
    </article>
  );
}
