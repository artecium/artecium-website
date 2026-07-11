interface ProgressBarProps {
  step: number;
  totalSteps: number;
  isTransitioning?: boolean;
}

export function ProgressBar({
  step,
  totalSteps,
  isTransitioning = false,
}: ProgressBarProps) {
  const progress = (step / totalSteps) * 100;

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-[#94A3B8]">
          Step {step} of {totalSteps}
        </p>
        {isTransitioning && (
          <span className="flex items-center gap-1.5 text-xs text-[#2563EB]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2563EB] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
            </span>
            Saving
          </span>
        )}
      </div>
      <div
        className="h-1 overflow-hidden rounded-full bg-[#1E293B]"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Step ${step} of ${totalSteps}`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
