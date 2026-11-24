"use client";

import type { ReactNode } from "react";

import { useReveal } from "@/hooks/useReveal";

export type ChallengeItem = {
  number: string;
  title: string;
  description: string;
};

type ChallengesListClientProps = {
  eyebrow: string;
  title: string;
  items: ChallengeItem[];
  closingLead: string;
  closingRest: string;
  titleId: string;
};

function RevealBlock({
  cascadeDelayMs = 0,
  className = "",
  children,
}: {
  cascadeDelayMs?: number;
  className?: string;
  children: ReactNode;
}) {
  const { ref, revealClass, transitionStyle } = useReveal({ cascadeDelayMs });
  return (
    <div ref={ref} className={`${revealClass} ${className}`.trim()} style={transitionStyle}>
      {children}
    </div>
  );
}

export function ChallengesListClient({
  eyebrow,
  title,
  items,
  closingLead,
  closingRest,
  titleId,
}: ChallengesListClientProps) {
  return (
    <section
      id="problems"
      aria-labelledby={titleId}
      className="border-t border-[#1E293B]/20 bg-[#F5F3EE] px-6 py-20 text-[#0E1324] sm:px-10 lg:px-16 lg:py-[100px]"
    >
      <div className="mx-auto max-w-[1160px]">
        <RevealBlock>
          <p className="text-sm font-medium tracking-[0.2em] text-[#2563EB] uppercase">{eyebrow}</p>
          <h2
            id={titleId}
            className="mt-4 max-w-[900px] text-[clamp(2.125rem,5.5vw,4.25rem)] font-bold leading-[1.02] tracking-tight text-[#0E1324]"
          >
            {title}
          </h2>
        </RevealBlock>

        <ol className="mt-12 list-none lg:mt-16">
          {items.map((item, index) => (
            <RevealBlock key={item.number} cascadeDelayMs={80 * (index + 1)}>
              <li
                tabIndex={0}
                className="group grid grid-cols-[minmax(2.75rem,4rem)_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-t border-[#1E293B]/15 py-8 transition-[padding,background-color] duration-300 last:border-b focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563EB] motion-reduce:transition-none lg:grid-cols-[4rem_1fr_auto] lg:gap-x-6 lg:py-[30px] [@media(hover:hover)]:lg:hover:pl-6 [@media(hover:hover)]:lg:hover:bg-white [@media(hover:hover)]:lg:focus-within:pl-6 [@media(hover:hover)]:lg:focus-within:bg-white"
              >
                <span
                  className="text-[clamp(1.5rem,4vw,4rem)] font-bold leading-none text-[#2563EB]"
                  aria-hidden="true"
                >
                  {item.number}
                </span>

                <div className="min-w-0">
                  <h3 className="text-[clamp(1.375rem,4vw,2.75rem)] font-bold leading-[1.1] tracking-tight text-[#0E1324]">
                    {item.title}
                  </h3>
                  <div
                    className="grid grid-rows-[1fr] transition-[grid-template-rows] duration-[350ms] ease-out motion-reduce:grid-rows-[1fr] lg:grid-rows-[0fr] lg:group-hover:grid-rows-[1fr] lg:group-focus-within:grid-rows-[1fr] [@media(hover:none)]:grid-rows-[1fr]"
                  >
                    <div className="overflow-hidden">
                      <p className="pt-3 text-base leading-relaxed text-[#475569] lg:pt-4 lg:text-lg">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>

                <span
                  aria-hidden="true"
                  className="hidden shrink-0 text-[30px] leading-none text-[#64748B] transition-[transform,color] duration-300 motion-reduce:transition-none sm:inline [@media(hover:hover)]:lg:group-hover:translate-x-2.5 [@media(hover:hover)]:lg:group-hover:text-[#2563EB] [@media(hover:hover)]:lg:group-focus-within:translate-x-2.5 [@media(hover:hover)]:lg:group-focus-within:text-[#2563EB]"
                >
                  →
                </span>
              </li>
            </RevealBlock>
          ))}
        </ol>

        <RevealBlock cascadeDelayMs={80 * (items.length + 1)} className="mt-12 lg:mt-16">
          <p className="max-w-[900px] text-[clamp(1.375rem,3vw,2.125rem)] leading-snug text-[#0E1324]">
            <span className="font-bold">{closingLead}</span>{" "}
            <span className="font-normal text-[#475569]">{closingRest}</span>
          </p>
        </RevealBlock>
      </div>
    </section>
  );
}
