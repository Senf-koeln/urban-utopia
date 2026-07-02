import {
  Content as RadixDialogContent,
  Portal as RadixDialogPortal,
  Root as RadixDialogRoot,
  Title as RadixDialogTitle,
} from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { config, useTransition } from "@react-spring/web";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { useIsMobile } from "../../../hooks/customDeviceDetect";
import { Z_INDEX } from "../../../util/zIndexLayers";
import ModalContainer from "./ModalContainer";
import type {
  ModalContainerProps,
  ModalOptions,
  ModalProps,
} from "./ModalStack.types";
import { getViewportRectCoords } from "./viewportRect";

function viewportModalAnchorStyle(): CSSProperties {
  return {
    position: "fixed",
    inset: 0,
    width: "100vw",
    height: "100vh",
    pointerEvents: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
    // Match drawer-style anchoring: center a clipped viewport box.
    overflow: "visible",
  };
}

function viewportModalFrameStyle(
  rect: NonNullable<ModalOptions["viewportRect"]>,
): CSSProperties {
  const { width, height } = getViewportRectCoords(rect);
  return {
    position: "relative",
    width,
    height,
    borderRadius: 8,
    overflow: "hidden",
  };
}

const viewportModalAnchorInnerStyle: CSSProperties = {
  pointerEvents: "auto",
  position: "relative",
  width: "100%",
  height: "100%",
  minHeight: 0,
  overflow: "hidden",
};

const viewportModalCenteredInnerStyle: CSSProperties = {
  ...viewportModalAnchorInnerStyle,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function shouldUseViewportSheetLayout(options?: ModalOptions): boolean {
  return Boolean(options?.size === "fullscreen" || options?.swipe || options?.isMobile);
}

const StackWrapper = styled.div<ModalOptions>`
  z-index: 5;
  position: fixed;
  bottom: ${({ isMobile }) => (isMobile ? 0 : "50%")};
  left: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Stack = ({
  stack,
  closeModal,
}: {
  stack: ModalProps[];
  closeModal: () => void;
}) => {
  const isMobile = useIsMobile();
  const topModalZIndex = stack[stack.length - 1]?.options?.zIndex;
  const modalStackZIndex =
    typeof topModalZIndex === "number"
      ? Math.max(Z_INDEX.MODAL_STACK, topModalZIndex)
      : Z_INDEX.MODAL_STACK;
  const [open, setOpen] = useState(!!stack.length);
  const modalIndex = (item: ModalProps) =>
    stack.length - stack.indexOf(item) - 1;
  const handleTransform = (
    prop: keyof Exclude<ModalOptions["transform"], undefined | boolean>,
    item: ModalProps,
    falseValue: number,
    defaultValue: number,
  ) => {
    const transform = item.options?.transform?.[prop];
    if (typeof transform === "function") return transform(modalIndex(item));
    if (transform === false || item.options?.transform === false)
      return falseValue;
    return defaultValue;
  };
  const x = (item: ModalProps, update = false) => {
    if (update) return handleTransform("x", item, 0, 0);
    if (item.options?.enterFrom === "right") return 200;
    if (item.options?.enterFrom === "left") return -200;
    return 0;
  };
  const y = (item: ModalProps, update = false) => {
    if (update) return handleTransform("y", item, 0, modalIndex(item) * -40);

    if (item.options?.swipe) return 1000;
    if (item.options?.enterFrom === "top") return -100;
    if (item.options?.enterFrom === "bottom") return 100;
    if (item.options?.enterFrom) return 0;
    return 30;
  };
  const scale = (item: ModalProps, update = false) => {
    if (update)
      return handleTransform("scale", item, 1, 1 - modalIndex(item) / 7);
    if (item.options?.enterFrom) return 0.9;
    return 1.1;
  };
  const away = (item: ModalProps) => ({
    opacity: 0,
    shading: 1,
    y: y(item),
    x: x(item),
    scale: item?.options?.swipe ? 1 : scale(item),
    pointerEvents: "none",
  });
  const modalStackTransition = useTransition(stack, {
    from: (item) => away(item),
    leave: (item) => away(item),
    onStart: () => setOpen(true),
    // onRest: (item) => {
    //   if (item.finished && stack.length === 0) {
    //     setOpen(false);
    //   }
    // },
    enter: {
      opacity: 1,
      shading: 1,
      y: 0,
      x: 0,
      scale: 1,
      pointerEvents: "auto",
    },
    update: (item) => [
      {
        shading: Math.min(1 / (modalIndex(item) + 1), 1),
        y: y(item, true),
        x: x(item, true),
        scale: item?.options?.swipe ? 1 : scale(item, true),
      },
    ],
    config: (item) =>
      item?.options?.transformIn === false ? { duration: 0 } : config.stiff,
  });

  useEffect(() => {
    // Introduce a timeout to delay the execution
    const timer = setTimeout(() => {
      if (!stack.length) {
        setOpen(false);
      }
    }, 900); // Delay of 1000 milliseconds (1 second)

    // Cleanup function to clear the timeout if the component unmounts or the dependencies change
    return () => clearTimeout(timer);
  }, [stack.length]); // Dependency on stack.length

  return (
    <RadixDialogRoot open={open}>
      <RadixDialogPortal>
        {/* <RadixDialog.Overlay /> */}
        <RadixDialogContent style={{ zIndex: modalStackZIndex }}>
          <VisuallyHidden asChild>
            <RadixDialogTitle>
              {stack[stack.length - 1]?.options?.ariaTitle ||
                stack[stack.length - 1]?.options?.title ||
                "Dialog"}
            </RadixDialogTitle>
          </VisuallyHidden>
          <StackWrapper isMobile={isMobile} id="modal-stack">
            {modalStackTransition((style, item) => {
              const viewportRect = item.options?.viewportRect;
              const modal = (
                <ModalContainer
                  item={item}
                  style={style as ModalContainerProps["style"]}
                  closeModal={closeModal}
                  index={modalIndex(item)}
                />
              );
              if (!viewportRect) {
                return modal;
              }
              return (
                <div style={viewportModalAnchorStyle()}>
                  <div style={viewportModalFrameStyle(viewportRect)}>
                    <div
                      style={
                        shouldUseViewportSheetLayout(item.options)
                          ? viewportModalAnchorInnerStyle
                          : viewportModalCenteredInnerStyle
                      }
                    >
                      {modal}
                    </div>
                  </div>
                </div>
              );
            })}
          </StackWrapper>
        </RadixDialogContent>
      </RadixDialogPortal>
    </RadixDialogRoot>
  );
};
export default Stack;
