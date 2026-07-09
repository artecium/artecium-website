import { ArteciumLogo } from "@/components/ArteciumLogo";

const footerLinks = {
  company: [
    { label: "About", href: "#about" },
    { label: "Services", href: "#services" },
    { label: "Solutions", href: "#solutions" },
    { label: "Contact", href: "#contact" },
  ],
  services: [
    { label: "AI Automation", href: "#services" },
    { label: "Custom Software", href: "#services" },
    { label: "Web Applications", href: "#services" },
    { label: "Cloud Solutions", href: "#services" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-[#1E293B] bg-[#050816] px-6 py-16 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center gap-2.5">
              <ArteciumLogo className="h-8 w-8" />
              <span className="text-sm font-semibold tracking-[0.2em] text-white">
                ARTECIUM
              </span>
            </a>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#94A3B8]">
              Engineering the future of business. Premium software, AI solutions,
              and digital products for forward-thinking companies.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-white">Company</h4>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-[#94A3B8] transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-white">Services</h4>
            <ul className="mt-4 space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-[#94A3B8] transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-[#1E293B] pt-8 sm:flex-row sm:items-center">
          <p className="text-sm text-[#64748B]">
            &copy; {new Date().getFullYear()} Artecium. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-sm text-[#64748B] transition-colors hover:text-[#94A3B8]"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-sm text-[#64748B] transition-colors hover:text-[#94A3B8]"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
