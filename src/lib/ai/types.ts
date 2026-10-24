export type FaqLinkKey = "websites" | "ia" | "seo" | "services" | "contact";

export interface FaqAiRequestBody {
  question: string;
  locale?: "pt-PT" | "en";
}

export interface FaqAiResponseBody {
  answer: string;
  linkKey: FaqLinkKey | null;
  hasInformation: boolean;
}

export interface FaqAiErrorResponse {
  error: string;
  code?: "RATE_LIMIT" | "VALIDATION" | "CONFIG" | "PROVIDER";
}
