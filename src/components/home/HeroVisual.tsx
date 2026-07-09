export function HeroVisual() {
  return (
    <div
      className="relative mx-auto flex h-[320px] w-full max-w-md items-center justify-center sm:h-[400px] lg:mx-0 lg:max-w-none"
      aria-hidden="true"
    >
      {/* Outer ring */}
      <div className="animate-orbit absolute h-72 w-72 rounded-full border border-[#1E293B]/60 sm:h-80 sm:w-80" />
      <div className="animate-orbit-reverse absolute h-56 w-56 rounded-full border border-[#2563EB]/20 sm:h-64 sm:w-64" />

      {/* Glow layers */}
      <div className="animate-glow-pulse absolute h-40 w-40 rounded-full bg-[#2563EB]/20 blur-3xl sm:h-48 sm:w-48" />
      <div className="animate-glow-pulse absolute h-28 w-28 rounded-full bg-[#2563EB]/40 blur-2xl [animation-delay:1.5s]" />

      {/* Core sphere */}
      <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0E1324] shadow-[0_0_60px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] sm:h-36 sm:w-36">
        <div className="absolute inset-2 rounded-full bg-gradient-to-tl from-transparent via-white/10 to-transparent" />
        <div className="h-16 w-16 rounded-full bg-[#2563EB]/30 blur-xl" />
      </div>

      {/* Orbiting nodes */}
      <div className="animate-orbit absolute h-72 w-72 sm:h-80 sm:w-80">
        <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-[#2563EB] shadow-[0_0_12px_rgba(37,99,235,0.8)]" />
        <div className="absolute bottom-4 left-4 h-2 w-2 rounded-full bg-white/60 shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
        <div className="absolute right-2 top-1/3 h-2.5 w-2.5 rounded-full bg-[#94A3B8] shadow-[0_0_10px_rgba(148,163,184,0.5)]" />
      </div>

      <div className="animate-orbit-reverse absolute h-56 w-56 sm:h-64 sm:w-64">
        <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#2563EB]/70" />
        <div className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white/40" />
      </div>

      {/* Connection lines */}
      <svg
        className="absolute inset-0 h-full w-full opacity-30"
        viewBox="0 0 400 400"
        fill="none"
      >
        <line
          x1="200"
          y1="200"
          x2="200"
          y2="60"
          stroke="#2563EB"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="animate-line-pulse"
        />
        <line
          x1="200"
          y1="200"
          x2="340"
          y2="140"
          stroke="#1E293B"
          strokeWidth="1"
        />
        <line
          x1="200"
          y1="200"
          x2="80"
          y2="300"
          stroke="#1E293B"
          strokeWidth="1"
        />
        <line
          x1="200"
          y1="200"
          x2="320"
          y2="280"
          stroke="#2563EB"
          strokeWidth="1"
          strokeOpacity="0.5"
          strokeDasharray="4 4"
          className="animate-line-pulse [animation-delay:1s]"
        />
      </svg>

      {/* Floating data points */}
      <div className="animate-float absolute -right-2 top-16 rounded-lg border border-[#1E293B] bg-[#0E1324]/90 px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-glow-pulse" />
          <span className="font-mono text-xs text-[#94A3B8]">AI Engine</span>
        </div>
      </div>

      <div className="animate-float-delayed absolute -left-4 bottom-20 rounded-lg border border-[#1E293B] bg-[#0E1324]/90 px-3 py-2 backdrop-blur-sm">
        <div className="font-mono text-xs text-[#94A3B8]">
          <span className="text-[#2563EB]">99.9%</span> uptime
        </div>
      </div>
    </div>
  );
}
