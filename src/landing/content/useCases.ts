import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  GraduationCap,
  Landmark,
  PenTool,
  Users2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export type UseCaseMeta = {
  slug: string;
  icon: LucideIcon;
  accent: string;
};

export const useCaseMetas: UseCaseMeta[] = [
  {
    slug: "schule",
    icon: GraduationCap,
    accent: "from-emerald-500/15 to-teal-500/5",
  },
  {
    slug: "kommunen",
    icon: Landmark,
    accent: "from-sky-500/15 to-blue-500/5",
  },
  {
    slug: "planung",
    icon: PenTool,
    accent: "from-stone-500/15 to-zinc-500/5",
  },
  {
    slug: "vereine",
    icon: Users2,
    accent: "from-violet-500/15 to-purple-500/5",
  },
  {
    slug: "hochschule",
    icon: Building2,
    accent: "from-amber-500/15 to-orange-500/5",
  },
];

export type UseCaseContent = UseCaseMeta & {
  title: string;
  shortTitle: string;
  teaser: string;
  tags: string[];
  heroTitle: string;
  heroSubtitle: string;
  audience: string[];
  challenges: string[];
  benefits: string[];
  scenarios: { title: string; description: string }[];
  workshopTip: string;
};

function buildUseCaseContent(
  meta: UseCaseMeta,
  t: ReturnType<typeof useTranslation<"landing">>["t"],
): UseCaseContent {
  const base = `useCases.${meta.slug}`;
  return {
    ...meta,
    title: t(`${base}.title`),
    shortTitle: t(`${base}.shortTitle`),
    teaser: t(`${base}.teaser`),
    tags: t(`${base}.tags`, { returnObjects: true }) as string[],
    heroTitle: t(`${base}.heroTitle`),
    heroSubtitle: t(`${base}.heroSubtitle`),
    audience: t(`${base}.audience`, { returnObjects: true }) as string[],
    challenges: t(`${base}.challenges`, { returnObjects: true }) as string[],
    benefits: t(`${base}.benefits`, { returnObjects: true }) as string[],
    scenarios: t(`${base}.scenarios`, { returnObjects: true }) as {
      title: string;
      description: string;
    }[],
    workshopTip: t(`${base}.workshopTip`),
  };
}

export function useUseCases(): UseCaseContent[] {
  const { t, i18n } = useTranslation("landing");
  return useMemo(
    () => useCaseMetas.map((meta) => buildUseCaseContent(meta, t)),
    [t, i18n.language],
  );
}

export function useUseCase(slug: string): UseCaseContent | undefined {
  const useCases = useUseCases();
  return useCases.find((useCase) => useCase.slug === slug);
}

export const useCaseSlugs = useCaseMetas.map((useCase) => useCase.slug);
