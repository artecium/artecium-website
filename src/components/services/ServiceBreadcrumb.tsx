import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ServiceBreadcrumbProps {
  items: BreadcrumbItem[];
  alternateHref: string;
  alternateLabel: string;
  languageLabel: string;
}

export function ServiceBreadcrumb({
  items,
  alternateHref,
  alternateLabel,
  languageLabel,
}: ServiceBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 pt-8 sm:px-10"
    >
      <ol className="flex flex-wrap items-center gap-2 text-sm text-[#64748B]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.label} className="flex items-center gap-2">
              {index > 0 ? (
                <span aria-hidden="true" className="text-[#334155]">
                  /
                </span>
              ) : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? "text-[#94A3B8]" : undefined}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <Link
        href={alternateHref}
        className="rounded-full border border-[#1E293B] px-3 py-1.5 text-xs font-medium text-[#94A3B8] transition-colors hover:border-[#334155] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
        aria-label={languageLabel}
      >
        {alternateLabel}
      </Link>
    </nav>
  );
}
