/**
 * Shared marketing / public-site Tailwind class fragments.
 * Prefer these over hard-coded hex values in page sections.
 */

export const marketing = {
  page: "bg-background text-foreground font-sans",
  section: "px-6 py-20 sm:px-10 sm:py-24 lg:px-16",
  sectionDivider: "border-t border-border-subtle",
  sectionAlt: "bg-background-subtle",
  eyebrow: "text-xs font-medium uppercase tracking-[0.2em] text-accent",
  titleLg:
    "text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]",
  titleMd: "text-2xl font-semibold tracking-tight text-foreground sm:text-3xl",
  body: "text-base leading-relaxed text-muted sm:text-lg",
  bodySm: "text-sm leading-relaxed text-muted",
  caption: "text-sm text-muted-subtle",
  card:
    "rounded-xl border border-border bg-surface p-6 transition-colors duration-200 hover:border-border-strong sm:p-8",
  cardInteractive:
    "rounded-xl border border-border bg-surface p-6 transition-colors duration-200 hover:border-border-strong hover:bg-surface-raised sm:p-8",
  link: "text-sm font-medium text-accent transition-colors hover:text-foreground",
  btnSecondary:
    "inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-6 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
  header:
    "sticky top-0 z-50 border-b border-border-subtle bg-background/90 backdrop-blur-md",
  navLink:
    "text-sm text-muted transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
} as const;