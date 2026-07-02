/**
 * Ensures an overlay renders above the trigger's stacking context.
 * Falls back to `baseZIndex` when no numeric ancestor z-index is found.
 */
export function resolveOverlayZIndex(
  triggerElement: HTMLElement | null | undefined,
  baseZIndex: number,
): number {
  if (typeof window === "undefined" || !triggerElement) {
    return baseZIndex;
  }

  let maxAncestorZIndex = Number.NEGATIVE_INFINITY;
  let current: HTMLElement | null = triggerElement;

  while (current) {
    const computed = window.getComputedStyle(current);
    const z = computed.zIndex;
    if (z && z !== "auto") {
      const numeric = Number.parseInt(z, 10);
      if (Number.isFinite(numeric)) {
        maxAncestorZIndex = Math.max(maxAncestorZIndex, numeric);
      }
    }
    current = current.parentElement;
  }

  if (!Number.isFinite(maxAncestorZIndex)) {
    return baseZIndex;
  }

  return Math.max(baseZIndex, maxAncestorZIndex + 1);
}
