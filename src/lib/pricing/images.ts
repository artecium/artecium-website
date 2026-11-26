import type { PricingCategory } from "./config";

export const PRICING_CATEGORY_IMAGES: Record<PricingCategory, string> = {
  websites: "/images/services/websites.jpg",
  aiAutomation: "/images/services/ai-automation.jpg",
  seo: "/images/services/seo.jpg",
  booking: "/images/pricing/booking.jpg",
};

export function pricingImageAltKey(category: PricingCategory): string {
  return `imageAlt.${category}`;
}