"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isLoading}
      className="inline-flex h-12 items-center justify-center rounded-full border border-[#1E293B] bg-[#0E1324] px-8 text-sm font-medium text-white transition-all duration-300 hover:border-[#334155] hover:bg-[#0E1324]/80 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? "Signing out…" : "Sign out"}
    </button>
  );
}
