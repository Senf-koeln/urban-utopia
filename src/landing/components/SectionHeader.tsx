import type { ReactNode } from "react";
import { motion } from "motion/react";

type SectionHeaderProps = {
  label: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
  dark?: boolean;
  className?: string;
};

export function SectionHeader({
  label,
  title,
  description,
  align = "left",
  dark = false,
  className = "",
}: SectionHeaderProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "";
  const maxDesc = align === "center" ? "max-w-2xl mx-auto" : "max-w-xl";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55 }}
      className={`mb-16 md:mb-20 ${alignClass} ${className}`}
    >
      <span
        className={`landing-section-label text-[11px] uppercase font-medium mb-5 block ${
          dark ? "text-white/45" : "text-[var(--uu-muted)]"
        }`}
      >
        {label}
      </span>
      <h2
        className={`landing-display text-4xl sm:text-5xl md:text-6xl font-medium max-w-4xl ${
          align === "center" ? "mx-auto" : ""
        } ${dark ? "text-white" : "text-[var(--uu-ink)]"}`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-6 text-lg leading-relaxed ${maxDesc} ${
            dark ? "text-white/60" : "text-[var(--uu-muted)]"
          }`}
        >
          {description}
        </p>
      ) : null}
    </motion.div>
  );
}
