export const PRIMARY_SERVICE_KEYS = ["websites", "aiAutomation", "seo"] as const;

export type PrimaryServiceKey = (typeof PRIMARY_SERVICE_KEYS)[number];

export interface ServiceCardItem {
  id: PrimaryServiceKey;
  imageSrc: string;
  imageAlt: string;
  title: string;
  intro: string;
  forWho: string;
  includes: string;
  ctaLabel: string;
  href: string;
  openDetailsAria: string;
}

export interface ServiceCardsLabels {
  includesHeading: string;
  forWhoHeading: string;
  closeModalAria: string;
  expandHint: string;
}