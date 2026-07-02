import { motion, useScroll, useTransform } from "motion/react";
import { Globe, Menu, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { WorkshopLink } from "./WorkshopLink";

const navLinkKeys = [
  { to: "/#features", labelKey: "nav.features" as const },
  { to: "/#how", labelKey: "nav.how" as const },
  { to: "/einsatz", labelKey: "nav.useCases" as const, isPage: true },
  { to: "/#voices", labelKey: "nav.voices" as const },
];

export function Navigation() {
  const { t, i18n } = useTranslation("landing");
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { scrollY } = useScroll();
  const backgroundColor = useTransform(
    scrollY,
    [0, 80],
    ["rgba(250, 250, 248, 0)", "rgba(250, 250, 248, 0.92)"],
  );
  const borderColor = useTransform(
    scrollY,
    [0, 80],
    ["rgba(10, 10, 10, 0)", "rgba(10, 10, 10, 0.06)"],
  );

  const isActive = (to: string) => {
    if (to === "/einsatz") {
      return location.pathname.startsWith("/einsatz");
    }
    return false;
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "de" : "en";
    i18n.changeLanguage(newLang);
  };

  const languageLabel = i18n.language === "en" ? "EN" : "DE";
  const languageTitle =
    i18n.language === "en" ? t("nav.switchToDe") : t("nav.switchToEn");

  return (
    <motion.nav
      style={{ backgroundColor, borderBottomColor: borderColor }}
      className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-[var(--uu-ink)] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="text-[var(--uu-accent)] text-sm font-bold">U</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-[var(--uu-ink)]">
            {t("common.brandName")}
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinkKeys.map((link) =>
            link.isPage ? (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm transition-colors ${
                  isActive(link.to)
                    ? "text-[var(--uu-ink)] font-medium"
                    : "text-[var(--uu-muted)] hover:text-[var(--uu-ink)]"
                }`}
              >
                {t(link.labelKey)}
              </Link>
            ) : (
              <a
                key={link.to}
                href={link.to}
                className="text-sm text-[var(--uu-muted)] hover:text-[var(--uu-ink)] transition-colors"
              >
                {t(link.labelKey)}
              </a>
            ),
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--uu-border)] bg-white/60 px-3 py-2 text-xs font-semibold text-[var(--uu-ink)] backdrop-blur-sm transition-colors hover:bg-white"
            title={languageTitle}
          >
            <Globe className="h-3.5 w-3.5" />
            {languageLabel}
          </button>
          <WorkshopLink className="landing-btn-accent px-5 py-2.5 rounded-full text-sm">
            {t("common.tryNow")}
          </WorkshopLink>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 -mr-2 text-[var(--uu-ink)]"
          aria-label={isOpen ? t("nav.closeMenu") : t("nav.openMenu")}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {isOpen ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden bg-[#fafaf8] border-t border-[var(--uu-border)]"
        >
          <div className="px-6 py-5 space-y-1">
            {navLinkKeys.map((link) =>
              link.isPage ? (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className="block py-2.5 text-sm text-[var(--uu-muted)]"
                >
                  {t(link.labelKey)}
                </Link>
              ) : (
                <a
                  key={link.to}
                  href={link.to}
                  onClick={() => setIsOpen(false)}
                  className="block py-2.5 text-sm text-[var(--uu-muted)]"
                >
                  {t(link.labelKey)}
                </a>
              ),
            )}
            <button
              type="button"
              onClick={() => {
                toggleLanguage();
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 py-2.5 text-sm text-[var(--uu-muted)]"
            >
              <Globe className="h-4 w-4" />
              {languageTitle}
            </button>
            <WorkshopLink
              onClick={() => setIsOpen(false)}
              className="landing-btn-accent block w-full text-center mt-4 px-6 py-3 rounded-full text-sm"
            >
              {t("common.tryNow")}
            </WorkshopLink>
          </div>
        </motion.div>
      ) : null}
    </motion.nav>
  );
}
