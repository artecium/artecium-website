import { COMPANY_WEBSITE } from "@/config/contact";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${COMPANY_WEBSITE}/sitemap.xml`,
  };
}
