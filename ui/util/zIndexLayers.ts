/**
 * Z-index layers for shared overlays. Keep values compact and explicit.
 * Order (low to high):
 * - PREVIEW_OVERLAY: Survey/info preview (device switcher + frame)
 * - DROPDOWN_OVERLAY: body-portaled select/combobox/dropdown content
 * - MODAL_STACK: modal backdrops and content
 * - DIALOG / GUIDED_TOUR / TOOLTIP / TOAST: global top-layer UI
 *
 * Dropdowns use DROPDOWN_OVERLAY when portaled to body so they sit above arbitrary
 * trigger containers. When the trigger is inside a modal, we portal into the modal
 * and use a high relative z-index so the modal stack still wins when a new modal opens.
 */
export const Z_INDEX = {
  /** Survey/info preview (device switcher + frame). Portaled to body. */
  PREVIEW_OVERLAY: 600,
  /** Preview controls (device toggles / close button). */
  PREVIEW_CONTROLS: 610,
  /** Select/combobox/dropdown overlays (portaled to body). Must be > PREVIEW_OVERLAY and < MODAL_STACK. */
  DROPDOWN_OVERLAY: 700,
  /** Modal stack wrapper and backdrop. Must be > DROPDOWN_OVERLAY. */
  MODAL_STACK: 800,
  /** When dropdown is portaled inside a modal, use this so it sits above modal content. */
  DROPDOWN_INSIDE_MODAL: 850,
  /** Generic dialog overlay/content layers. */
  DIALOG_OVERLAY: 900,
  DIALOG_CONTENT: 910,
  /** Guided tour overlay/content layers. */
  GUIDED_TOUR_OVERLAY: 920,
  GUIDED_TOUR_CONTENT: 930,
  /** Tooltips must stay above all other overlays (including legacy high-z drawers/modals). */
  TOOLTIP: 2_147_483_647,
  RTE_POPOVER: 950,
  /** Toasts should remain on top of other overlays. */
  TOAST: 980,
  /**
   * Report builder slide canvas chrome (settings gear). Portaled to body.
   * Above {@link PREVIEW_OVERLAY} but below AdministratingHeader (9999).
   * Hidden entirely while report preview is open.
   */
  REPORT_BUILDER_SLIDE_CONTROLS: 9900,
  /** Report builder canvas view switcher (desktop / mobile / A4). */
  REPORT_BUILDER_VIEW_SWITCHER: 100,
} as const;
