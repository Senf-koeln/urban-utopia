import { motion } from "motion/react";
import { ArrowRight, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ContactDialog } from "../components/ContactDialog";
import { SectionHeader } from "../components/SectionHeader";
import { WorkshopLink } from "../components/WorkshopLink";
import { useUseCases } from "../content/useCases";
import { LandingShell } from "./LandingShell";

export default function UseCasesOverviewPage() {
  const { t } = useTranslation("landing");
  const useCases = useUseCases();

  return (
    <LandingShell>
      <section className="pt-28 pb-16 md:pt-32 md:pb-20 px-6 landing-mesh">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            label={t("useCasesOverview.label")}
            title={
              <>
                {t("useCasesOverview.title")}
                <span className="italic font-normal text-[var(--uu-muted)]">
                  {" "}
                  {t("useCasesOverview.titleAccent")}
                </span>
              </>
            }
            description={t("useCasesOverview.description")}
          />
        </div>
      </section>

      <section className="landing-bg-white-alt landing-section-grain px-6 pb-24 pt-16 md:pb-32 md:pt-20 lg:px-16">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-5">
          {useCases.map((useCase, index) => (
            <motion.article
              key={useCase.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
            >
              <Link
                to={`/einsatz/${useCase.slug}`}
                className="landing-card block rounded-3xl p-8 md:p-10 transition-shadow overflow-hidden relative group h-full"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${useCase.accent} pointer-events-none`}
                />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--uu-ink)] flex items-center justify-center mb-6">
                    <useCase.icon className="w-6 h-6 text-[var(--uu-accent)]" />
                  </div>
                  <h2 className="text-2xl font-semibold text-[var(--uu-ink)] mb-3 group-hover:underline decoration-[var(--uu-accent)] decoration-2 underline-offset-4">
                    {useCase.title}
                  </h2>
                  <p className="text-[var(--uu-muted)] leading-relaxed mb-6">
                    {useCase.teaser}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {useCase.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/80 border border-[var(--uu-border)] text-[var(--uu-muted)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--uu-ink)]">
                    {t("useCasesOverview.learnMore")}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="landing-bg-white landing-section-grain relative overflow-hidden px-6 pb-24 pt-0 lg:px-16 md:pb-32">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-[2rem] px-6 py-10 text-white md:px-10 md:py-12"
          >
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-br from-[var(--uu-ink)] via-[#121812] to-[#0a0a0a]"
            />
            <div
              aria-hidden
              className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[var(--uu-accent)]/25 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[var(--uu-accent)]/10 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_0%,rgba(149,229,101,0.12),transparent)]"
            />
            <div
              aria-hidden
              className="absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/10"
            />

            <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-12">
              <div className="max-w-xl">
                <h2 className="landing-display mb-4 text-3xl font-medium md:text-4xl lg:text-[2.75rem]">
                  {t("useCasesOverview.ctaTitle")}
                </h2>
                <p className="max-w-lg text-base leading-relaxed text-white/55 md:text-lg">
                  {t("useCasesOverview.ctaDescription")}
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
                <WorkshopLink className="landing-btn-accent group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-semibold">
                  {t("common.tryNow")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </WorkshopLink>
                <ContactDialog source="usecases-overview">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-4 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-white/10"
                  >
                    <Mail className="h-4 w-4" />
                    {t("common.requestContact")}
                  </button>
                </ContactDialog>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </LandingShell>
  );
}
