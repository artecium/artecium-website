"use client";

import type { CSSProperties, ReactNode } from "react";

import { useReveal } from "@/hooks/useReveal";

export type WhyStackCardContent = {
  index: number;
  number: string;
  total: string;
  title: string;
  description: string;
};

export type WhyStackCard = WhyStackCardContent & {
  theme: WhyCardTheme;
};

export type WhyCardTheme = {
  card: string;
  title: string;
  description: string;
  indicator: string;
  numeral: string;
  border: string;
  shadow: string;
};

type WhyStackClientProps = {
  eyebrow: string;
  title: string;
  cards: WhyStackCardContent[];
  titleId: string;
};

function RevealHeader({ children }: { children: ReactNode }) {
  const { ref, revealClass, transitionStyle, reduceMotion } = useReveal();
  return (
    <div
      ref={ref}
      className={`${revealClass} ${reduceMotion ? "" : "motion-reduce:translate-y-0 motion-reduce:opacity-100"}`}
      style={transitionStyle}
    >
      {children}
    </div>
  );
}

function StackCard({
  card,
  style,
  className,
}: {
  card: WhyStackCard;
  style: CSSProperties;
  className: string;
}) {
  const { ref, revealClass, transitionStyle, reduceMotion } = useReveal({ variant: "stack" });

  return (
    <li
      className={`sticky mb-7 list-none motion-reduce:static max-[700px]:top-[calc(80px+var(--i)*16px)] top-[calc(96px+var(--i)*22px)] ${className}`}
      style={style}
    >
      <article
        className={`flex min-h-[300px] flex-col justify-between rounded-[28px] border p-[26px] min-[700px]:min-h-[340px] min-[700px]:p-10 ${card.theme.card} ${card.theme.border} ${card.theme.shadow} max-[700px]:gap-6 sm:flex-row sm:items-end`}
      >
        <div
          ref={ref}
          style={transitionStyle}
          className={`${revealClass} flex w-full flex-1 flex-col justify-between max-[700px]:gap-6 sm:flex-row sm:items-end ${
            reduceMotion ? "motion-reduce:translate-y-0 motion-reduce:rotate-0 motion-reduce:opacity-100" : ""
          }`}
        >
        <div className="flex min-w-0 flex-1 flex-col justify-end">
          <p
            className={`text-xs font-bold tracking-[0.14em] uppercase opacity-80 ${card.theme.indicator}`}
          >
            {card.number}
            <span className="mx-1.5 font-normal opacity-60">/</span>
            {card.total}
          </p>
          <h3
            className={`mt-4 max-w-[560px] text-[clamp(1.875rem,5vw,3.625rem)] font-bold leading-[1.05] tracking-tight ${card.theme.title}`}
          >
            {card.title}
          </h3>
          <p className={`mt-4 max-w-[460px] text-[1.1875rem] leading-relaxed ${card.theme.description}`}>
            {card.description}
          </p>
        </div>
        <span
          aria-hidden="true"
          className={`shrink-0 self-end text-[clamp(6.875rem,18vw,15rem)] font-semibold leading-[0.8] opacity-[0.16] ${card.theme.numeral}`}
        >
          {card.number}
        </span>
        </div>
      </article>
    </li>
  );
}

const CARD_THEMES: WhyCardTheme[] = [
  {
    card: "bg-[#1d4ed8]",
    title: "text-white",
    description: "text-white/90",
    indicator: "text-white",
    numeral: "text-white",
    border: "border-[#2563EB]/45",
    shadow: "shadow-[0_-8px_32px_rgba(37,99,235,0.18)]",
  },
  {
    card: "bg-[#0E1324]",
    title: "text-white",
    description: "text-[#CBD5E1]",
    indicator: "text-[#94A3B8]",
    numeral: "text-white",
    border: "border-[#1E293B]",
    shadow: "shadow-[0_-8px_32px_rgba(0,0,0,0.35)]",
  },
  {
    card: "bg-[#12151c]",
    title: "text-white",
    description: "text-[#94A3B8]",
    indicator: "text-[#64748B]",
    numeral: "text-white",
    border: "border-[#1E293B]",
    shadow: "shadow-[0_-8px_32px_rgba(0,0,0,0.28)]",
  },
  {
    card: "bg-[#0a0d14]",
    title: "text-white",
    description: "text-[#94A3B8]",
    indicator: "text-[#64748B]",
    numeral: "text-white",
    border: "border-[#1E293B]",
    shadow: "shadow-[0_-8px_32px_rgba(0,0,0,0.25)]",
  },
  {
    card: "bg-[#0E1324]",
    title: "text-white",
    description: "text-[#CBD5E1]",
    indicator: "text-[#60A5FA]",
    numeral: "text-[#2563EB]",
    border: "border-[#2563EB]/35",
    shadow: "shadow-[0_-8px_32px_rgba(37,99,235,0.12)]",
  },
];

export function WhyStackClient({ eyebrow, title, cards, titleId }: WhyStackClientProps) {
  const themedCards: WhyStackCard[] = cards.map((card) => ({
    ...card,
    theme: CARD_THEMES[card.index] ?? CARD_THEMES[0],
  }));
  return (
    <section
      id="about"
      aria-labelledby={titleId}
      className="border-t border-[#1E293B]/60 bg-[#050816] px-6 pt-[110px] pb-[120px] text-white sm:px-10 lg:px-16"
    >
      <div className="mx-auto max-w-[1160px]">
        <RevealHeader>
          <p className="text-sm font-medium tracking-[0.2em] text-[#2563EB] uppercase">{eyebrow}</p>
          <h2
            id={titleId}
            className="mt-4 mb-12 text-[clamp(2.125rem,5.5vw,4.25rem)] font-bold leading-[1.02] tracking-tight text-white"
          >
            {title}
          </h2>
        </RevealHeader>

        <ol className="m-0 list-none p-0">
          {themedCards.map((card) => (
            <StackCard
              key={card.index}
              card={card}
              style={{ "--i": card.index } as CSSProperties}
              className={card.index === themedCards.length - 1 ? "mb-0" : ""}
            />
          ))}
          <li aria-hidden="true" className="pointer-events-none h-[min(40vh,320px)] min-[700px]:h-[min(45vh,420px)]" />
        </ol>
      </div>
    </section>
  );
}
