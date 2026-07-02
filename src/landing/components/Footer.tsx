import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CONTACT_EMAIL } from "../constants";
import { WorkshopLink } from "./WorkshopLink";
import { useUseCases } from "../content/useCases";

const homeLinkKeys = [
  { href: "/#features", labelKey: "nav.features" as const },
  { href: "/#how", labelKey: "nav.how" as const },
  { href: "/#showcase", labelKey: "nav.showcase" as const },
  { href: "/#voices", labelKey: "nav.voices" as const },
];

export function Footer() {
  const { t } = useTranslation("landing");
  const useCases = useUseCases();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="landing-bg-footer landing-section-grain relative overflow-hidden text-[var(--uu-ink)] py-16 px-6 border-t border-[var(--uu-border)] [&_a]:text-[var(--uu-ink)]">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-12 gap-12 mb-14">
          <div className="md:col-span-4">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 bg-[var(--uu-ink)] rounded-xl flex items-center justify-center">
                <span className="text-[var(--uu-accent)] text-sm font-bold">U</span>
              </div>
              <span className="text-sm font-semibold">{t("common.brandName")}</span>
            </Link>
            <p className="text-[var(--uu-muted)] text-sm max-w-sm leading-relaxed">
              {t("footer.description")}
            </p>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--uu-muted)] mb-4">
              {t("footer.product")}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <WorkshopLink className="hover:opacity-70 transition-opacity">
                  {t("common.tryNow")}
                </WorkshopLink>
              </li>
              {homeLinkKeys.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="hover:opacity-70 transition-opacity">
                    {t(link.labelKey)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--uu-muted)] mb-4">
              {t("footer.useCases")}
            </h4>
            <ul className="space-y-2.5 text-sm columns-1 sm:columns-2">
              {useCases.map((useCase) => (
                <li key={useCase.slug} className="break-inside-avoid">
                  <Link
                    to={`/einsatz/${useCase.slug}`}
                    className="hover:opacity-70 transition-opacity"
                  >
                    {useCase.title}
                  </Link>
                </li>
              ))}
              <li className="break-inside-avoid">
                <Link to="/einsatz" className="hover:opacity-70 transition-opacity font-medium">
                  {t("footer.allUseCases")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[var(--uu-border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-[var(--uu-muted)] text-sm">
            {t("footer.copyright", { year: currentYear })}
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-sm hover:opacity-70 transition-opacity"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
}
