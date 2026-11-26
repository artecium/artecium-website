"use client";

import {
  MotionConfig,
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState } from "react";

export interface HomeFaqAccordionItem {
  id: string;
  question: string;
  answer: string;
}

interface HomeFaqAccordionProps {
  items: HomeFaqAccordionItem[];
  listLabel: string;
  className?: string;
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

const springTransition: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 46,
  mass: 0.9,
};

interface AccordionRowProps {
  item: HomeFaqAccordionItem;
  index: number;
  total: number;
  openIndex: number;
  onToggle: (index: number) => void;
  reduceMotion: boolean | null;
  baseId: string;
}

function AccordionRow({
  item,
  index,
  total,
  openIndex,
  onToggle,
  reduceMotion,
  baseId,
}: AccordionRowProps) {
  const isOpen = index === openIndex;
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => setContentHeight(el.scrollHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [item.answer, isOpen]);

  const isFirst = index === 0;
  const isLast = index === total - 1;
  const isBeforeOpen = index === openIndex - 1;
  const isAfterOpen = index === openIndex + 1;
  const isAlone =
    (isAfterOpen && isLast) || (isBeforeOpen && isFirst) || (isOpen && total === 1);

  const borderTopWidth = isFirst || isAfterOpen || isOpen ? 1 : 0;
  const borderBottomWidth = isLast || isBeforeOpen || isOpen ? 1 : 0;

  let borderTopLeftRadius = 0;
  let borderTopRightRadius = 0;
  let borderBottomLeftRadius = 0;
  let borderBottomRightRadius = 0;

  if (isOpen || isAlone) {
    borderTopLeftRadius = 16;
    borderTopRightRadius = 16;
    borderBottomLeftRadius = 16;
    borderBottomRightRadius = 16;
  } else if (isBeforeOpen) {
    borderBottomLeftRadius = 16;
    borderBottomRightRadius = 16;
  } else if (isAfterOpen) {
    borderTopLeftRadius = 16;
    borderTopRightRadius = 16;
  } else if (isFirst) {
    borderTopLeftRadius = 16;
    borderTopRightRadius = 16;
  } else if (isLast) {
    borderBottomLeftRadius = 16;
    borderBottomRightRadius = 16;
  }

  const panelId = `${baseId}-panel-${item.id}`;
  const buttonId = `${baseId}-button-${item.id}`;

  return (
    <motion.li layout={!reduceMotion}>
      <motion.div
        animate={{
          borderTopLeftRadius,
          borderTopRightRadius,
          borderBottomLeftRadius,
          borderBottomRightRadius,
          marginTop: isOpen && !reduceMotion ? 8 : 0,
          marginBottom: isOpen && !reduceMotion ? 8 : 0,
        }}
        transition={reduceMotion ? { duration: 0.01 } : springTransition}
        className="overflow-hidden border-[#1E293B] bg-[#0E1324] will-change-transform"
        style={{
          borderTopWidth: borderTopWidth,
          borderBottomWidth: borderBottomWidth,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderStyle: "solid",
        }}
      >
        <button
          id={buttonId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => onToggle(isOpen ? -1 : index)}
          className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-[#121a2e]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB]/50 sm:px-5 sm:py-[18px]"
        >
          <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-white sm:text-base">
            {item.question}
          </span>

          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={reduceMotion ? { duration: 0.01 } : springTransition}
            className="shrink-0 text-[#64748B]"
          >
            <ChevronDownIcon className="h-5 w-5" />
          </motion.span>
        </button>

        <motion.div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          initial={false}
          animate={{
            height: isOpen ? contentHeight : 0,
            opacity: isOpen ? 1 : 0,
          }}
          transition={
            reduceMotion
              ? { duration: 0.01 }
              : { ...springTransition, opacity: { duration: 0.2 } }
          }
          className="overflow-hidden"
        >
          <div ref={contentRef}>
            <div className="max-w-prose border-t border-[#1E293B]/80 px-4 pb-5 pt-1 text-sm leading-relaxed text-[#94A3B8] sm:px-5 sm:pb-6 sm:pt-2 sm:text-[15px]">
              {item.answer}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.li>
  );
}

export function HomeFaqAccordion({
  items,
  listLabel,
  className = "mt-12",
}: HomeFaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState(-1);
  const reduceMotion = useReducedMotion();
  const baseId = useId();

  const handleToggle = useCallback((index: number) => {
    setOpenIndex((prev) => (index === -1 ? -1 : prev === index ? -1 : index));
  }, []);

  const transition = reduceMotion ? { duration: 0.01 } : springTransition;

  return (
    <MotionConfig transition={transition}>
      <ul aria-label={listLabel} className={`${className} w-full list-none p-0`}>
        {items.map((item, index) => (
          <AccordionRow
            key={item.id}
            item={item}
            index={index}
            total={items.length}
            openIndex={openIndex}
            onToggle={handleToggle}
            reduceMotion={reduceMotion}
            baseId={baseId}
          />
        ))}
      </ul>
    </MotionConfig>
  );
}