"use client";

interface CookieSwitchProps {
  id: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  label: string;
}

export function CookieSwitch({
  id,
  checked,
  disabled = false,
  onChange,
  label,
}: CookieSwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E1324] ${
        disabled
          ? "cursor-not-allowed border-[#1E293B] bg-[#2563EB]/30"
          : checked
            ? "border-[#2563EB]/50 bg-[#2563EB]"
            : "border-[#334155] bg-[#050816]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
