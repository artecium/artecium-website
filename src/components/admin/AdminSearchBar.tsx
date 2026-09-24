"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface AdminSearchBarProps {
  placeholder?: string;
  paramName?: string;
  defaultValue?: string;
}

export function AdminSearchBar({
  placeholder = "Search...",
  paramName = "q",
  defaultValue = "",
}: AdminSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set(paramName, value.trim());
    } else {
      params.delete(paramName);
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full max-w-md rounded-xl border border-[#1E293B] bg-[#0E1324] px-3 py-2 text-sm text-white placeholder:text-[#64748B]"
      />
      <button
        type="submit"
        className="rounded-xl border border-[#1E293B] bg-[#050816] px-4 py-2 text-sm text-[#94A3B8] hover:text-white"
      >
        Search
      </button>
    </form>
  );
}
