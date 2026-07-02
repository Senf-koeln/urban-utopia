import { a, config, to, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import React, { useRef } from "react";
import styled from "styled-components";

import { useIsMobile } from "../../../hooks/customDeviceDetect";
import { useOnKeyDown } from "../../../hooks/useOnKeyDown";
import type theme from "../../../styles/theme";
import ModalActionButtons from "./ModalActionButtons";
import ModalHandle from "./ModalHandle";
import ModalHeader from "./ModalHeader";
import type { ModalContainerProps, ModalOptions } from "./ModalStack.types";
import { getViewportRectCoords } from "./viewportRect";

const ClickEventBlocker = styled.div`
  position: absolute;
  inset: 0;
  z-index: 99998;
`;
const OUTER_BLOCKED_PROPS = new Set([
  "size",
  "isMobile",
  "width",
  "overflowing",
  "paddingBottom",
  "viewportAnchored",
  "viewportSheetLayout",
]);
interface OuterProps {
  size: ModalOptions["size"];
  isMobile: ModalOptions["isMobile"];
  width: ModalOptions["width"];
  overflowing: boolean;
  paddingBottom: number;
  /** When true, modal is inside a preview-frame anchor — never use fixed/inset:0 (would pin to window). */
  viewportAnchored?: boolean;
  /** True for anchored sheets/fullscreen that should keep absolute positioning. */
  viewportSheetLayout?: boolean;
  theme: typeof theme;
}
const OuterBase = styled.div.withConfig({
  shouldForwardProp: (prop) => !OUTER_BLOCKED_PROPS.has(prop),
})<OuterProps>`
  border-radius: ${({ theme, size }) =>
    size === "fullscreen" ? "0" : `${theme.radii[5]}px`};
  /* touch-action: none; */
  touch-action: ${({ overflowing }) => !overflowing && "none"};
  /* Ensure modal content renders above modal backdrop and drawer */
  /* z-index: 11001; */
  position: ${({ size, isMobile, viewportAnchored, viewportSheetLayout }) =>
    viewportAnchored
      ? viewportSheetLayout
        ? "absolute"
        : "relative"
      : size === "fullscreen" && isMobile
        ? "fixed"
        : "absolute"};
  inset: ${({ size, isMobile }) =>
    size === "fullscreen" && isMobile ? "0 !important" : "initial"};
  min-height: ${({ size, isMobile }) =>
    size === "fullscreen" && isMobile
      ? "var(--modal-vh, var(--vh, 100vh))"
      : false};
  max-height: ${({ size, theme, paddingBottom, viewportAnchored, isMobile }) =>
    size === "fullscreen" && isMobile
      ? "var(--modal-vh, var(--vh, 100vh))"
      : viewportAnchored || size !== "fullscreen"
        ? `calc(var(--modal-vh, var(--vh, 100vh)) - ${theme.space[7]} + ${paddingBottom}px)`
        : "var(--modal-vh, var(--vh, 100vh))"};
  background: ${({ theme }) => theme.colors.palette.grey};
  width: ${({ theme, size, width }) => (width ? `${width}px` : theme.width(size))};
  max-width: ${({ theme, size, viewportAnchored }) =>
    viewportAnchored || size !== "fullscreen" ? theme.width("lg", true) : null};
`;
const Outer = a(OuterBase);

const INNER_BLOCKED_PROPS = new Set(["size", "paddingBottom"]);
interface InnerProps {
  size: ModalOptions["size"];
  paddingBottom: number;
  opacity: number;
  theme: typeof theme;
}
const InnerBase = styled.div.withConfig({
  shouldForwardProp: (prop) => !INNER_BLOCKED_PROPS.has(prop),
})<InnerProps>`
  background-color: white;
  min-height: 120px;
  border-radius: ${({ theme, size }) =>
    size === "fullscreen" ? "0" : `${theme.radii[5]}px`};
  padding: 0;
  padding-bottom: ${({ paddingBottom }) => `${paddingBottom}px`};
  opacity: ${({ opacity }) => opacity};
  position: relative;
  z-index: 0;
`;

const Inner = a(InnerBase);

const ModalContainer = ({
  item,
  index,
  style,
  closeModal,
}: ModalContainerProps) => {
  const { type: ModalComponent, props } = item;
  const options = item.options || {};

  // Filter out non-DOM props that shouldn't be passed to the component
  // These are modal options that get merged into props but aren't valid DOM attributes
  // const nonDomProps = new Set([
  //   "zIndex",
  //   "transform",
  //   "modalPayload",
  //   "modalHandle",
  //   "onSubmit",
  //   "onClose",
  //   "closeModal",
  //   "preventClose",
  //   "setOpacity",
  //   "index",
  //   "submitDisabled",
  //   "submitText",
  //   "submitLoading",
  //   "critical",
  //   "cancelVariant",
  //   "cancelText",
  //   "size",
  //   "swipe",
  //   "enterFrom",
  //   "replace",
  //   "beforeOpen",
  //   "afterOpen",
  //   "beforeClose",
  //   "afterClose",
  //   "isMobile",
  //   "closeButtonVariant",
  // ]);
  // const componentProps = Object.fromEntries(
  //   Object.entries(props).filter(([key]) => !nonDomProps.has(key)),
  // ) as typeof props;

  useOnKeyDown((e) => {
    if (e.code === "Escape" && options.onClose) {
      options.onClose();
    }
    // if (e.code === "Enter" && options.onSubmit) {
    //   options.onSubmit();
    // }
  });

  const viewportRect = options?.viewportRect;
  const viewportCoords = viewportRect
    ? getViewportRectCoords(viewportRect)
    : null;
  const viewportHeight =
    viewportCoords?.height ??
    viewportRect?.height ??
    (typeof window !== "undefined" ? window.innerHeight : undefined);

  const height = options?.height ?? 0.0001;
  const realHeight = 500;

  options.onClose ??= closeModal;
  options.closeModal ??= closeModal;
  const isMobileFallback = useIsMobile();
  options.isMobile = options.isMobile ?? isMobileFallback;

  const [innerHeight, setInnerHeight] = React.useState(0);
  const [outerHeight, setOuterHeight] = React.useState(0);
  const [overflowing, setOverflowing] = React.useState(options?.swipe);
  const wrapperRef = React.useRef<HTMLElement>(null);
  const sheetRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    setTimeout(() => {
      setInnerHeight(sheetRef.current?.offsetHeight || 0);
      setOuterHeight(wrapperRef.current?.offsetHeight || 0);
      setOverflowing(outerHeight < innerHeight);
    }, 0);
  }, [innerHeight, outerHeight]);

  // if swipe
  const [{ y }, api] = useSpring(() => ({ y: height }));
  const swipePadding = 1000;
  const open = ({ canceled }) => {
    api.start({
      y: 0,
      immediate: false,
      config: canceled ? config.wobbly : config.stiff,
    });
  };
  const close = (velocity = 0) => {
    // onDrag(0.001)
    api.start({
      y: height + swipePadding,
      immediate: false,
      config: { ...config.stiff, velocity },
      onRest: () => closeModal(),
    });
  };

  const bind = useDrag(
    ({
      last,
      velocity: [, vy],
      direction: [, dy],
      movement: [, my],
      cancel,
      canceled,
    }) => {
      if (my < -70) cancel();
      if (!last) return api.start({ y: my, immediate: true });
      if (my > realHeight * 0.2 || (vy > 0.5 && dy > 0)) return close(vy);

      return open({ canceled });
    },
    {
      from: () => [0, y.get()],
      filterTaps: true,
      bounds: { top: 0 },
      rubberband: true,
    },
  );

  const bindContainer = options?.isMobile &&
    !overflowing &&
    options?.size !== "fullscreen" && { ...bind() };
  const bindHandle = options?.isMobile && overflowing && { ...bind() };

  const PADDING = options?.isMobile ? 100 : 0;
  const isViewportAnchored = !!viewportCoords;
  const shouldUseViewportSheetLayout =
    isViewportAnchored &&
    (options?.size === "fullscreen" || options?.swipe || options?.isMobile);
  const effectiveWidth =
    typeof options?.width === "number" &&
    typeof viewportCoords?.width === "number"
      ? Math.min(options.width, viewportCoords.width)
      : options?.width;
  /** For anchored bottom sheets/fullscreen, keep frame width. Center regular dialogs. */
  const outerWidth =
    shouldUseViewportSheetLayout && typeof options?.width !== "number"
      ? viewportCoords.width
      : effectiveWidth;
  const outerStyle = {
    ...style,
    y: to([y, style?.y || 0], (dragged, offset) => dragged + offset),
    ...(typeof viewportHeight === "number"
      ? ({ "--modal-vh": `${viewportHeight}px` } as React.CSSProperties)
      : null),
    ...(isViewportAnchored
      ? shouldUseViewportSheetLayout
        ? ({
            left: 0,
            right: 0,
            marginLeft: "auto",
            marginRight: "auto",
            maxWidth: "100%",
          } as React.CSSProperties)
        : ({
            maxWidth: "100%",
          } as React.CSSProperties)
      : null),
    // maxWidth: theme.width("lg", true),
    // maxHeight: getMaxHeight(options, PADDING),
    overflow: options?.overflow
      ? options?.overflow
      : overflowing
        ? "auto"
        : "hidden",
    bottom: options?.isMobile ? -PADDING : "auto",
    ...(typeof options?.zIndex === "number"
      ? { zIndex: options.zIndex }
      : {}),
  };
  const innerStyle = {
    paddingBottom:
      options?.size !== "fullscreen" && options?.isMobile ? PADDING : 0,
    opacity: style?.shading,
  };
  // console.log(ModalComponent, typeof ModalComponent)
  // if (typeof ModalComponent !== "string") return null

  let timeout = undefined as ReturnType<typeof setTimeout> | undefined;
  clearTimeout(timeout);
  const pause = React.useRef(false);
  const handleClose =
    typeof closeModal === "function"
      ? () => {
          if (!pause.current) {
            closeModal();
            pause.current = true;
          }
          timeout = setTimeout(() => {
            pause.current = false;
          }, 3000);
        }
      : false;

  const subscriptions = useRef<
    NonNullable<ModalOptions["subscriptions"]>["current"]
  >({});

  return (
    <Outer
      {...bindContainer}
      size={options?.size}
      isMobile={options?.isMobile}
      width={outerWidth}
      overflowing={overflowing}
      paddingBottom={PADDING}
      viewportAnchored={isViewportAnchored}
      viewportSheetLayout={shouldUseViewportSheetLayout}
      style={outerStyle}
      ref={wrapperRef}
      className={options?.classNames?.outer}
    >
      <Inner
        paddingBottom={PADDING}
        size={options?.size}
        style={innerStyle}
        ref={sheetRef}
        data-cy={options?.["data-cy"]}
        id={options?.id}
        className={options?.classNames?.inner}
      >
        <div
          {...bindHandle}
          style={{ position: "sticky", top: 0, zIndex: 999 }}
        >
          <ModalHandle
            swipe={!!options?.swipe}
            onClose={options?.onClose ?? false}
            closeModal={options.closeModal as () => void}
            color={options?.color}
            size={options?.size}
            modalHandle={options?.modalHandle}
            closeButtonVariant={options?.closeButtonVariant}
          />
        </div>
        <ModalHeader {...options} subscriptions={subscriptions} />
        {options?.style ? (
          <div style={{ ...options?.style }}>
            {React.createElement(ModalComponent as React.ElementType, {
              ...(props as Record<string, unknown>),
              subscriptions,
            })}
          </div>
        ) : (
          React.createElement(ModalComponent as React.ElementType, {
            ...(props as Record<string, unknown>),
            subscriptions,
          })
        )}
        <ModalActionButtons {...options} subscriptions={subscriptions} />
        {index > 0 && typeof handleClose === "function" && (
          <ClickEventBlocker onClick={handleClose} />
        )}
      </Inner>
    </Outer>
  );
};

export default ModalContainer;
