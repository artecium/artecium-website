import Link from "next/link";

export interface DashboardQuickLink {
  label: string;
  href: string;
}

interface DashboardQuickLinksProps {
  title: string;
  links: DashboardQuickLink[];
}

export function DashboardQuickLinks({ title, links }: DashboardQuickLinksProps) {
  return (
    <section className="rounded-2xl border border-[#1E293B] bg-[#0E1324] p-6">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-center justify-between rounded-xl border border-[#1E293B] bg-[#050816]/40 px-4 py-3 text-sm font-medium text-[#E2E8F0] transition-colors hover:border-[#2563EB]/30 hover:bg-[#0E1324] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
            >
              {link.label}
              <span className="text-[#64748B]" aria-hidden>
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
