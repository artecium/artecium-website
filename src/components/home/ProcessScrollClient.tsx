"use client";

import { useActiveStep } from "@/hooks/useActiveStep";

export interface ProcessScrollStep {
  number: string;
  title: string;
  description: string;
}

interface ProcessScrollClientProps {
  eyebrow: string;
  title: string;
  description: string;
  titleId: string;
  steps: ProcessScrollStep[];
}

export function ProcessScrollClient({
  eyebrow,
  title,
  description,
  titleId,
  steps,
}: ProcessScrollClientProps) {
  const { activeIndex, setStepRef, interactive, reduceMotion } = useActiveStep(steps.length);

  return (
    <section
      id="process"
      aria-labelledby={titleId}
      className="border-t border-[#1E293B]/60 bg-[#0E1324]/20 px-6 py-20 sm:px-10 sm:py-24 lg:px-16 lg:py-[100px]"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          <header className="lg:sticky lg:top-[120px] lg:self-start">
            <p className="text-sm font-medium tracking-[0.2em] text-[#2563EB] uppercase">
              {eyebrow}
            </p>
            <h2
              id={titleId}
              className="mt-4 text-[clamp(2.375rem,6vw,4.75rem)] font-bold leading-[1.02] tracking-tight text-white"
            >
              {title}
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-[#94A3B8] sm:text-lg">
              {description}
            </p>
          </header>

          <ol className="list-none">
            {steps.map((step, index) => {
              const isActive = activeIndex === index;
              const dimmed = interactive && !isActive;

              return (
                <li
                  key={step.number}
                  ref={setStepRef(index)}
                  aria-current={isActive && interactive ? "step" : undefined}
                  className={[
                    "flex min-h-[180px] flex-col justify-center border-[#1E293B]/80 py-8 lg:min-h-[300px] lg:py-10",
                    index < steps.length - 1 ? "border-b" : "",
                    !reduceMotion && interactive ? "transition-opacity duration-300" : "",
                    dimmed ? "opacity-[0.25]" : "opacity-100",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div
                    className={
                      !reduceMotion && interactive && isActive
                        ? "translate-x-0.5 transition-transform duration-300"
                        : undefined
                    }
                  >
                    <span
                      className={[
                        "block text-[clamp(2.5rem,8vw,4rem)] font-semibold leading-none tracking-tight",
                        isActive && interactive ? "text-[#2563EB]" : "text-[#64748B]",
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      {step.number}
                    </span>
                    <h3 className="mt-4 text-2xl font-bold tracking-tight text-white lg:text-[2.125rem] lg:leading-tight">
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-xl text-base leading-relaxed text-[#94A3B8] lg:text-lg">
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
