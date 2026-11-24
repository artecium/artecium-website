import { SITE_URL } from "@/config/seo";
import { isPortalHostname, readRequestHostname } from "@/lib/routing";
import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const requestHeaders = await headers();
  const hostname = readRequestHostname((name) => requestHeaders.get(name));

  if (isPortalHostname(hostname)) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/client", "/login", "/acesso", "/en/acesso", "/booking/admin"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
