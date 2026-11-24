import { ArteciumLogo } from "@/components/ArteciumLogo";
import { COMPANY_EMAIL } from "@/config/contact";
import type { AppLocale } from "@/i18n/config";
import { getBlogHubPath } from "@/lib/blog/paths";
import { getFaqPath } from "@/lib/faq/paths";
import { getTranslationsForLocale } from "@/lib/i18n/server-translations";
import { resolveRequestLocale } from "@/lib/i18n/resolve-locale";
import { getLegalPaths } from "@/lib/legal/paths";
import { PUBLIC_AUTH_ENTRY_PATH } from "@/lib/auth/entry-routes";
import { getProjectsHubPath } from "@/lib/projects/paths";
import {
  getServicePath,
  getServicesHubPath,
} from "@/lib/services/paths";
import Link from "next/link";

const serviceLinkKeys = [
  { id: "websites" as const, labelKey: "websites" as const },
  { id: "ia" as const, labelKey: "aiAutomation" as const },
  { id: "seo" as const, labelKey: "seo" as const },
] as const;

interface FooterProps {
  locale?: AppLocale;
}

export async function Footer({ locale: localeProp }: FooterProps = {}) {
  const locale = localeProp ?? (await resolveRequestLocale());
  const t = await getTranslationsForLocale(locale, "home.footer");
  const nav = await getTranslationsForLocale(locale, "navigation");
  const clientAuthHref = PUBLIC_AUTH_ENTRY_PATH;
  const services = await getTranslationsForLocale(locale, "home.services");
  const shared = await getTranslationsForLocale(locale, "services.shared");
  const legalPaths = getLegalPaths(locale);
  const hubPath = getServicesHubPath(locale);
  const faqPath = getFaqPath(locale);
  const blogPath = getBlogHubPath(locale);
  const projectsPath = getProjectsHubPath(locale);
  const homePath = locale === "en" ? "/en" : "/";

  return (
    <footer className="border-t border-[#1E293B] bg-[#050816] px-6 py-16 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href={homePath} className="flex items-center gap-3">
              <ArteciumLogo className="h-9 w-9 sm:h-10 sm:w-10" />
              <span className="text-sm font-semibold tracking-[0.2em] text-white">
                ARTECIUM
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#94A3B8]">
              {t("description")}
            </p>
            <p className="mt-4">
              <a
                href={`mailto:${COMPANY_EMAIL}`}
                className="text-sm text-[#94A3B8] transition-colors hover:text-white"
              >
                {COMPANY_EMAIL}
              </a>
            </p>
            <p className="mt-2 text-sm text-[#64748B]">{t("serviceArea")}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-white">{t("company")}</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href={hubPath}
                  className="text-sm text-[#94A3B8] transition-colors hover:text-white"
                >
                  {nav("services")}
                </Link>
              </li>
              <li>
                <a
                  href={`${homePath}#pricing`}
                  className="text-sm text-[#94A3B8] transition-colors hover:text-white"
                >
                  {nav("pricing")}
                </a>
              </li>
              <li>
                <Link
                  href={projectsPath}
                  className="text-sm text-[#94A3B8] transition-colors hover:text-white"
                >
                  {nav("projects")}
                </Link>
              </li>
              <li>
                <Link
                  href={blogPath}
                  className="text-sm text-[#94A3B8] transition-colors hover:text-white"
                >
                  {nav("blog")}
                </Link>
              </li>
              <li>
                <Link
                  href={faqPath}
                  className="text-sm text-[#94A3B8] transition-colors hover:text-white"
                >
                  {nav("faq")}
                </Link>
              </li>
              <li>
                <a
                  href={`${homePath}#contact`}
                  className="text-sm text-[#94A3B8] transition-colors hover:text-white"
                >
                  {nav("contact")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-white">{t("services")}</h4>
            <ul className="mt-4 space-y-3">
              {serviceLinkKeys.map((link) => (
                <li key={link.id}>
                  <Link
                    href={getServicePath(link.id, locale)}
                    className="text-sm text-[#94A3B8] transition-colors hover:text-white"
                  >
                    {services(`${link.labelKey}.title`)}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={hubPath}
                  className="text-sm text-[#94A3B8] transition-colors hover:text-white"
                >
                  {shared("allServices")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-[#1E293B] pt-8 sm:flex-row sm:items-center">
          <p className="text-sm text-[#64748B]">
            &copy; {new Date().getFullYear()} Artecium. {t("copyright")}
          </p>
          <div className="flex flex-wrap gap-6">
            <Link
              href={clientAuthHref}
              className="text-sm text-[#64748B] transition-colors hover:text-[#94A3B8]"
            >
              {nav("clientLogin")}
            </Link>
            <Link
              href="/admin/login"
              className="text-sm text-[#64748B] transition-colors hover:text-[#94A3B8]"
            >
              {nav("admin")}
            </Link>
            <Link
              href={legalPaths.privacy}
              className="text-sm text-[#64748B] transition-colors hover:text-[#94A3B8]"
            >
              {nav("privacyPolicy")}
            </Link>
            <Link
              href={legalPaths.cookies}
              className="text-sm text-[#64748B] transition-colors hover:text-[#94A3B8]"
            >
              {nav("cookiePolicy")}
            </Link>
            <Link
              href={legalPaths.terms}
              className="text-sm text-[#64748B] transition-colors hover:text-[#94A3B8]"
            >
              {nav("termsConditions")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
