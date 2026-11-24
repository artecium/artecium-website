"use client";

import { useId, useState } from "react";

export interface FaqAccordionItem {
  id: string;
  question: string;
  answer: string;
}

interface HomeFaqAccordionProps {
  items: FaqAccordionItem[];
}

export function HomeFaqAccordion({ items }: HomeFaqAccordionProps) {
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <ul className="mt-12 space-y-2">
      {items.map((item) => {
        const isOpen = openId === item.id;
        const panelId = `${baseId}-${item.id}-panel`;
        const buttonId = `${baseId}-${item.id}-button`;

        return (
          <li
            key={item.id}
            className="overflow-hidden rounded-xl border border-border bg-surface"
          >
            <h3 className="m-0">
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-medium text-foreground transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40"
              >
                <span>{item.question}</span>
                <span
                  className={`shrink-0 text-muted-subtle transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
                  aria-hidden
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden">
                <p className="border-t border-border-subtle px-5 py-4 text-sm leading-relaxed text-muted">
                  {item.answer}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}