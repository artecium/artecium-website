import { ArteciumLogo } from "@/components/ArteciumLogo";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { constructMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = constructMetadata({
  title: "Admin Login",
  description: "Sign in to the Artecium back office.",
  path: "/admin/login",
  noIndex: true,
});

export default function AdminLoginPage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden bg-[#050816] px-6 py-16 font-sans text-white sm:px-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-[#2563EB]/[0.04] blur-[120px] animate-glow-pulse" />
        <div className="absolute -left-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-[#0D47A1]/[0.06] blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="group flex flex-col items-center gap-3">
            <ArteciumLogo
              className="h-10 w-10 transition-transform duration-300 group-hover:scale-105 sm:h-11 sm:w-11"
              priority
            />
            <span className="text-sm font-semibold tracking-[0.2em] text-white">
              ARTECIUM
            </span>
          </Link>
        </div>

        <div className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.3)] sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Admin Login
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#94A3B8] sm:text-base">
              Access the Artecium back office.
            </p>
          </div>

          <AdminLoginForm />
        </div>

        <p className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#94A3B8] transition-colors duration-200 hover:text-white"
          >
            Back to homepage
          </Link>
        </p>
      </div>
    </div>
  );
}
