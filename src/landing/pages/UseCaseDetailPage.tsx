import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams } from "react-router-dom";
import { WorkshopLink } from "../components/WorkshopLink";
import { useUseCase, useUseCases } from "../content/useCases";
import { LandingShell } from "./LandingShell";

export default function UseCaseDetailPage() {
  const { t } = useTranslation("landing");
  const { slug } = useParams<{ slug: string }>();
  const useCase = slug ? useUseCase(slug) : undefined;
  const allUseCases = useUseCases();

  if (!useCase) {
    return <Navigate to="/einsatz" replace />;
  }

  const otherCases = allUseCases.filter((item) => item.slug !== useCase.slug).slice(0, 3);

  return (
    <LandingShell>
      <section className={`pt-28 pb-16 md:pt-32 px-6 bg-gradient-to-br ${useCase.accent}`}>
        <div className="max-w-4xl mx-auto">
          <Link
            to="/einsatz"
            className="inline-flex items-center gap-2 text-sm text-[var(--uu-muted)] hover:text-[var(--uu-ink)] mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("useCaseDetail.backLink")}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-14 h-14 rounded-2xl bg-[var(--uu-ink)] flex items-center justify-center mb-6">
              <useCase.icon className="w-7 h-7 text-[var(--uu-accent)]" />
            </div>
            <p className="landing-section-label text-[11px] uppercase font-medium text-[var(--uu-muted)] mb-4">
              {useCase.title}
            </p>
            <h1 className="landing-display text-4xl sm:text-5xl md:text-6xl font-medium text-[var(--uu-ink)] mb-5">
              {useCase.heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-[var(--uu-muted)] leading-relaxed max-w-2xl mb-8">
              {useCase.heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-2">
              {useCase.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/80 border border-[var(--uu-border)] text-[var(--uu-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-xl font-semibold mb-4">{t("useCaseDetail.forWhom")}</h2>
            <ul className="space-y-3">
              {useCase.audience.map((item) => (
                <li key={item} className="flex gap-3 text-[var(--uu-muted)]">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-[var(--uu-accent-dark)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">{t("useCaseDetail.challenges")}</h2>
            <ul className="space-y-3">
              {useCase.challenges.map((item) => (
                <li key={item} className="text-[var(--uu-muted)] leading-relaxed pl-4 border-l-2 border-[var(--uu-border)]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 px-6 bg-[var(--uu-surface)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="landing-display text-3xl font-medium mb-8">
            {t("useCaseDetail.benefitsTitle")}
          </h2>
          <ul className="grid sm:grid-cols-1 gap-4 mb-12">
            {useCase.benefits.map((benefit) => (
              <li
                key={benefit}
                className="landing-card rounded-2xl p-5 text-[var(--uu-muted)] leading-relaxed"
              >
                {benefit}
              </li>
            ))}
          </ul>

          <h3 className="text-xl font-semibold mb-6">{t("useCaseDetail.formatsTitle")}</h3>
          <div className="space-y-4">
            {useCase.scenarios.map((scenario) => (
              <div key={scenario.title} className="landing-card rounded-2xl p-6">
                <h4 className="font-semibold text-[var(--uu-ink)] mb-2">
                  {scenario.title}
                </h4>
                <p className="text-sm text-[var(--uu-muted)] leading-relaxed">
                  {scenario.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto landing-card rounded-3xl p-8 md:p-10 border-l-4 border-l-[var(--uu-accent)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--uu-muted)] mb-3">
            {t("useCaseDetail.tipLabel")}
          </p>
          <p className="text-[var(--uu-ink)] leading-relaxed">{useCase.workshopTip}</p>
        </div>
      </section>

      <section className="py-16 md:py-24 px-6 bg-[var(--uu-ink)] text-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <h2 className="landing-display text-3xl md:text-4xl font-medium mb-3">
              {t("useCaseDetail.startWorkshopTitle", { shortTitle: useCase.shortTitle })}
            </h2>
            <p className="text-white/55 max-w-lg leading-relaxed">
              {t("useCaseDetail.startWorkshopDescription")}
            </p>
          </div>
          <WorkshopLink className="landing-btn-accent shrink-0 group px-8 py-4 rounded-full flex items-center gap-2 text-sm font-semibold">
            {t("useCaseDetail.startWorkshop")}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </WorkshopLink>
        </div>
      </section>

      <section className="py-16 px-6 border-t border-[var(--uu-border)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--uu-muted)] mb-6">
            {t("useCaseDetail.moreUseCases")}
          </h2>
          <div className="flex flex-wrap gap-3">
            {otherCases.map((item) => (
              <Link
                key={item.slug}
                to={`/einsatz/${item.slug}`}
                className="px-4 py-2 rounded-full border border-[var(--uu-border)] text-sm text-[var(--uu-muted)] hover:text-[var(--uu-ink)] hover:border-[var(--uu-ink)]/20 transition-colors"
              >
                {item.title}
              </Link>
            ))}
            <Link
              to="/einsatz"
              className="px-4 py-2 rounded-full text-sm font-medium text-[var(--uu-ink)] underline underline-offset-4"
            >
              {t("useCaseDetail.showAll")}
            </Link>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
