export type LegalDocumentId = "privacy" | "cookies" | "terms";

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

export interface LegalSection {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDocumentContent {
  title: string;
  description: string;
  lastUpdated: string;
  disclaimer?: string;
  showToc?: boolean;
  tocLabel?: string;
  sections: LegalSection[];
}
