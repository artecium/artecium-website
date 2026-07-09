import { ArteciumLogo } from "@/components/ui/ArteciumLogo";

const navLinks = [
  { label: "Services", href: "#services" },
  { label: "Solutions", href: "#solutions" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#1E293B]/60 bg-[#050816]/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-16">
        <a href="#" className="group flex items-center gap-3">
          <ArteciumLogo
            className="h-9 w-9 transition-transform duration-300 group-hover:scale-105 sm:h-10 sm:w-10"
            priority
          />
          <span className="text-sm font-semibold tracking-[0.2em] text-white sm:text-[0.9375rem]">
            ARTECIUM
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-[#94A3B8] transition-colors duration-200 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a
            href="#contact"
            className="hidden rounded-full bg-[#2563EB] px-5 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-[#1D4ED8] hover:shadow-[0_0_24px_rgba(37,99,235,0.3)] sm:inline-flex"
          >
            Start Project
          </a>

          <details className="relative md:hidden">
            <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg border border-[#1E293B] bg-[#0E1324] text-[#94A3B8] transition-colors hover:text-white [&::-webkit-details-marker]:hidden">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </summary>
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-[#1E293B] bg-[#0E1324] p-2 shadow-2xl">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block rounded-lg px-3 py-2 text-sm text-[#94A3B8] transition-colors hover:bg-[#1E293B]/40 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#contact"
                className="mt-1 block rounded-lg bg-[#2563EB] px-3 py-2 text-center text-sm font-medium text-white"
              >
                Start Project
              </a>
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}
