import { a, useTransition } from "@react-spring/web";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Z_INDEX } from "../../../util/zIndexLayers";
import type { ModalProps } from "./ModalStack.types";

type ViewportRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const BackgroundWrapper = ({
  stack,
  closeModal,
}: {
  stack: ModalProps[];
  closeModal: () => void;
}) => {
  const [pointerEvents, setPointerEvents] =
    useState<React.CSSProperties["pointerEvents"]>("none");
  useEffect(() => {
    setPointerEvents(stack.length > 0 ? "auto" : "none");
  }, [stack.length]);

  const lastViewportRectRef = useRef<ViewportRect | undefined>(undefined);

  const top = stack?.[stack?.length - 1];
  const rawViewportRect = top?.options?.viewportRect as ViewportRect | undefined;

  if (rawViewportRect) {
    lastViewportRectRef.current = rawViewportRect;
  } else if (top != null) {
    // Active modal uses full viewport — do not keep a stale constrained rect.
    lastViewportRectRef.current = undefined;
  }

  const viewportRect =
    rawViewportRect ?? lastViewportRectRef.current ?? undefined;
  const hasViewportRect = Boolean(rawViewportRect);
  const viewportBackdropZIndex =
    hasViewportRect && typeof top?.options?.zIndex === "number"
      ? top.options.zIndex - 1
      : Z_INDEX.MODAL_STACK;

  const backdropOpacity = (() => {
    const raw = top?.options?.backdropOpacity;
    if (typeof raw === "number" && Number.isFinite(raw)) {
      return Math.min(1, Math.max(0, raw));
    }
    return 0.5;
  })();

  const backgroundTransition = useTransition(stack.length, {
    from: { opacity: 0 },
    leave: { opacity: 0 },
    enter: { opacity: backdropOpacity },
    update: { opacity: backdropOpacity },
  });

  return backgroundTransition((style, item) => {
    return item ? (
      <a.div
        style={{
          ...style,
          pointerEvents,
          position: "fixed",
          top: viewportRect?.top ?? 0,
          left: viewportRect?.left ?? 0,
          width: viewportRect ? `${viewportRect.width}px` : "100vw",
          height: viewportRect ? `${viewportRect.height}px` : "100vh",
          borderRadius: viewportRect ? "0.5rem" : 0,
          background: "black",
          zIndex: viewportBackdropZIndex,
        }}
        onClick={() => {
          const opts = top?.options || {};
          // Keep viewport-backed swipe sheets dismissible via dim backdrop.
          if (!opts?.preventClose) {
            if (typeof opts?.onClose === "function") {
              try {
                opts.onClose();
              } catch {}
            }
            closeModal();
          }
        }}
      />
    ) : null;
  });
};
export default BackgroundWrapper;
