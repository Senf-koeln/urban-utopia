import type { ModalOptions } from "./ModalStack.types";

/** Normalizes viewport bounds (supports `x`/`y` like DOMRect). */
export function getViewportRectCoords(
  rect: NonNullable<ModalOptions["viewportRect"]>,
) {
  const top = rect.top ?? rect.y ?? 0;
  const left = rect.left ?? rect.x ?? 0;
  return { top, left, width: rect.width, height: rect.height };
}
