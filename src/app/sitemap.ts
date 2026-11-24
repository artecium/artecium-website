import { getBlogArticlePath, getBlogHubPath } from "@/lib/blog/paths";
import { BLOG_ARTICLE_LIST } from "@/lib/blog/registry";
import { getProjectPath, getProjectsHubPath } from "@/lib/projects/paths";
import { PROJECTS } from "@/lib/projects/registry";
import { SITE_URL } from "@/config/seo";
import type { MetadataRoute } from "next";

const SITE_LAUNCH = new Date("2026-01-01");
const CONTENT_UPDATE = new Date("2026-09-26");

const productLandingPaths = [
  "/area-cliente",
  "/booking",
  "/en/client-area",
  "/en/booking",
] as const;

const legalPaths = [
  "/privacy",
  "/cookies",
  "/terms",
  "/en/privacy",
  "/en/cookies",
  "/en/terms",
] as const;

const servicePaths = [
  "/servicos",
  "/en/servicos",
  "/servicos/websites",
  "/en/servicos/websites",
  "/servicos/ia",
  "/en/servicos/ia",
  "/servicos/seo",
  "/en/servicos/seo",
] as const;

const blogPaths = [
  getBlogHubPath("pt-PT"),
  getBlogHubPath("en"),
  ...BLOG_ARTICLE_LIST.flatMap((article) => [
    getBlogArticlePath(article.id, "pt-PT"),
    getBlogArticlePath(article.id, "en"),
  ]),
] as const;

const projectHubPaths = [
  getProjectsHubPath("pt-PT"),
  getProjectsHubPath("en"),
] as const;

const projectDetailPaths = PROJECTS.flatMap((project) => [
  getProjectPath(project.slugs["pt-PT"], "pt-PT"),
  getProjectPath(project.slugs.en, "en"),
]);

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: CONTENT_UPDATE,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/en`,
      lastModified: CONTENT_UPDATE,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...servicePaths.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: CONTENT_UPDATE,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...productLandingPaths.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: CONTENT_UPDATE,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
    {
      url: `${SITE_URL}/faq`,
      lastModified: CONTENT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/en/faq`,
      lastModified: CONTENT_UPDATE,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...blogPaths.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: CONTENT_UPDATE,
      changeFrequency: "monthly" as const,
      priority: path.endsWith("/blog") || path.endsWith("/en/blog") ? 0.75 : 0.7,
    })),
    ...projectHubPaths.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: CONTENT_UPDATE,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
    ...projectDetailPaths.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: CONTENT_UPDATE,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...legalPaths.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: SITE_LAUNCH,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
