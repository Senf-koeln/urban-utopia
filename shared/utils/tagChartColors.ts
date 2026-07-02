/**
 * Single source of truth for survey/table tag color keys and their chart (palette) fills.
 * Tag UI variants live in `Tag.tsx`; every key here must have a matching `TagVariant` color.
 */

const TAG_COLOR_CHART_VARS = [
  ["dark-red", "var(--palette-red-800)"],
  ["dark-rose", "var(--palette-rose-800)"],
  ["dark-purple", "var(--palette-purple-800)"],
  ["dark-blue", "var(--palette-blue-800)"],
  ["dark-teal", "var(--palette-teal-800)"],
  ["dark-green", "var(--palette-green-800)"],
  ["dark-yellow", "var(--palette-yellow-700)"],
  ["dark-orange", "var(--palette-orange-800)"],
  ["dark-brown", "var(--palette-brown-800)"],
  ["dark-grey", "var(--palette-neutral-800)"],
  ["red", "var(--palette-red-700)"],
  ["rose", "var(--palette-rose-600)"],
  ["purple", "var(--palette-purple-600)"],
  ["blue", "var(--palette-blue-600)"],
  ["teal", "var(--palette-teal-600)"],
  ["green", "var(--palette-green-600)"],
  ["yellow", "var(--palette-yellow-500)"],
  ["orange", "var(--palette-orange-600)"],
  ["brown", "var(--palette-brown-600)"],
  ["grey", "var(--palette-neutral-600)"],
  ["light-red", "var(--palette-red-400)"],
  ["light-rose", "var(--palette-rose-400)"],
  ["light-purple", "var(--palette-purple-400)"],
  ["light-blue", "var(--palette-blue-400)"],
  ["light-teal", "var(--palette-teal-400)"],
  ["light-green", "var(--palette-green-400)"],
  ["light-yellow", "var(--palette-yellow-300)"],
  ["light-orange", "var(--palette-orange-400)"],
  ["light-brown", "var(--palette-brown-400)"],
  ["light-grey", "var(--palette-neutral-400)"],
] as const;

export type TagColorKey = (typeof TAG_COLOR_CHART_VARS)[number][0];

export const TAG_COLOR_KEYS: TagColorKey[] = TAG_COLOR_CHART_VARS.map(
  ([key]) => key,
);

export const tagColorKeyToCssVar = Object.fromEntries(
  TAG_COLOR_CHART_VARS,
) as Record<TagColorKey, string>;

export const TAG_COLOR_KEY_SET = new Set<string>(TAG_COLOR_KEYS);

/** `CustomFieldsForm` / tag manager color swatches (order = picker order). */
export const TAG_COLOR_FORM_OPTIONS: { color: TagColorKey }[] =
  TAG_COLOR_KEYS.map((color) => ({ color }));

/** Dot / small swatch: same fill as charts for known keys. */
export function resolveTagDotFill(color: string): string {
  if (
    color.includes("#") ||
    color.includes("hsla") ||
    color.includes("var")
  ) {
    return color;
  }
  if (TAG_COLOR_KEY_SET.has(color)) {
    return tagColorKeyToCssVar[color as TagColorKey];
  }
  return `var(--tag-surface-selected-${color}, ${color})`;
}
