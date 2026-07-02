/** @format */

import * as RadixDialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { a, config, useTransition } from "@react-spring/web";
import React from "react";
import { springConfig } from "@shared/index";
import { useOnKeyDown } from "../../../hooks/useOnKeyDown";
import { cn } from "../../../util/classNameConstructor";
import Button from "../../core/button/Button";
import type { DrawerOptions, DrawerState } from "./Drawer.types";
import {
  useDrawerLiveRegistry,
  useDrawerRepaintTick,
} from "./DrawerLivePropsContext";

interface DrawerProps {
  drawerState: DrawerState;
  closeDrawer: () => void;
  portalContainer?: HTMLElement | null;
}

const DrawerContent = ({
  drawerState,
  drawerZ,
  handleClose,
  closeDrawer,
  repaintTick,
}: {
  drawerState: DrawerState;
  drawerZ: number;
  handleClose: () => void;
  closeDrawer: () => void;
  repaintTick: number;
}) => {
  const { isOpen, drawer } = drawerState;
  const registry = useDrawerLiveRegistry();

  // useTransition expects an array – when item removed, leave runs. Boolean doesn't trigger leave.
  const drawerTransitions = useTransition(
    isOpen && drawer ? [{ id: "drawer", tick: repaintTick }] : [],
    {
      keys: (item) => item.id,
      from: {
        x: drawer?.options?.side === "right" ? 100 : -100,
        opacity: 0,
      },
      enter: {
        x: 0,
        opacity: 1,
      },
      update: {
        x: 0,
        opacity: 1,
      },
      leave: {
        x: drawer?.options?.side === "right" ? 100 : -100,
        opacity: 0,
      },
      config: springConfig.brisk,
    },
  );

  if (!drawer) return null;
  const options = drawer.options ?? {};
  const drawerId = options.id;
  const viewportRect = options.viewportRect;
  const side = options.side || "left";
  const height = viewportRect?.height;
  const width = options.width || 420;
  const liveProps =
    drawerId && registry
      ? registry.propsMapRef.current.get(drawerId)
      : undefined;

  return drawerTransitions((style, item) =>
    item ? (
      <a.div
        className={cn(
          // Always receive clicks; when onClose is false the viewport wrapper uses
          // pointer-events-none so the map stays interactive — this panel must opt in.
          "pointer-events-auto absolute bg-surface-default overflow-y-auto border-border-subdued",
          side === "left" ? "shadow-r-lg border-r" : "shadow-l-lg border-l",
          !viewportRect && "top-0 bottom-0",
          !viewportRect ? (side === "left" ? "left-0" : "right-0") : "",
          options.className,
        )}
        style={{
          ...style,
          top: 0,
          height: typeof height === "number" ? `${height}px` : "100vh",
          width: `${width}px`,
          left: side === "left" ? "0px" : undefined,
          right: side === "right" ? "0px" : undefined,
          zIndex: drawerZ,
        }}
      >
        {options.onClose !== false && (
          <Button
            variant={options.closeButtonVariant ?? "basic"}
            leadingIcon="x-md"
            classNameWrapper="absolute top-3 right-3 z-10"
            aria-label="Close drawer"
            onClick={handleClose}
          />
        )}
        {React.cloneElement(
          drawer.element as React.ReactElement<Record<string, unknown>>,
          {
            ...(liveProps ?? {}),
            repaintTick: item.tick,
            closeDrawer,
            drawerOptions: options,
          },
        )}
      </a.div>
    ) : null,
  );
};
const DrawerViewportWrapper = ({
  viewportRect,
  children,
  showViewportBackdrop,
  handleClose,
  drawerZ,
  isOpen,
}: {
  viewportRect:
    | { top: number; left: number; width: number; height: number }
    | undefined;
  children: React.ReactNode;
  showViewportBackdrop: boolean;
  handleClose: () => void;
  drawerZ: number;
  isOpen: boolean;
}) => {
  const backgroundTransitions = useTransition(isOpen ? [1] : [], {
    from: {
      opacity: 0,
    },
    enter: {
      opacity: 1,
    },
    leave: {
      opacity: 0,
    },
    config: config.slow,
  });
  return (
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center",
        !showViewportBackdrop && "pointer-events-none",
      )}
      style={{ zIndex: drawerZ }}
    >
      <div
        className={cn("relative overflow-hidden", viewportRect && "rounded-lg")}
        style={{
          width: viewportRect?.width ?? "100vw",
          height: viewportRect?.height ?? "100vh",
        }}
      >
        {backgroundTransitions((style, item) =>
          item && showViewportBackdrop ? (
            <a.div
              style={{
                ...style,
              }}
              role="presentation"
              aria-hidden
              className="pointer-events-auto touch-manipulation select-none bg-black/10 inset-0 absolute"
              onPointerDown={(e) => {
                e.preventDefault();
                handleClose();
              }}
            />
          ) : null,
        )}
        {children}
      </div>
    </div>
  );
};

const Drawer: React.FC<DrawerProps> = ({
  drawerState,
  closeDrawer,
  portalContainer,
}) => {
  const repaintTick = useDrawerRepaintTick();
  const { isOpen, drawer } = drawerState;

  useOnKeyDown((e) => {
    if (e.code === "Escape" && drawer?.options?.onClose !== false) {
      closeDrawer();
    }
  });

  if (!drawer) return null;

  const options = (drawer.options ?? {}) as DrawerOptions;

  const viewportRect = options.viewportRect;
  const showViewportBackdrop =
    options.onClose !== false && !options.preventClose;

  const drawerZ = options.zIndex ?? 100000;

  const handleClose = () => {
    if (options.onClose !== false) {
      if (typeof options.onClose === "function") {
        try {
          options.onClose();
        } catch {}
      }
      closeDrawer();
    }
  };
  return (
    <RadixDialog.Root open={isOpen} modal={false}>
      <RadixDialog.Portal forceMount container={portalContainer || undefined}>
        <RadixDialog.Content
          forceMount
          style={
            viewportRect
              ? {
                  top: viewportRect.top,
                  left: viewportRect.left,
                  width: viewportRect.width,
                  height: viewportRect.height,
                }
              : {}
          }
          className={cn(
            "overflow-hidden",
            showViewportBackdrop &&
              "pointer-events-none border-0 bg-transparent p-0 shadow-none outline-none",
          )}
          onPointerDownOutside={options?.onPointerDownOutside}
        >
          <VisuallyHidden asChild>
            <RadixDialog.Title>{options.title || "Drawer"}</RadixDialog.Title>
          </VisuallyHidden>

          <DrawerViewportWrapper
            viewportRect={viewportRect}
            drawerZ={drawerZ}
            handleClose={handleClose}
            showViewportBackdrop={showViewportBackdrop}
            isOpen={isOpen}
          >
            <DrawerContent
              drawerState={drawerState}
              drawerZ={drawerZ}
              handleClose={handleClose}
              closeDrawer={closeDrawer}
              repaintTick={repaintTick}
            />
          </DrawerViewportWrapper>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
};

export default Drawer;
