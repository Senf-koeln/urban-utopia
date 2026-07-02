/**
 * Inspired by React Modal Stack
 * Author: Matt Jennings
 * npm: @mattjennings/react-modal-stack
 * github: https://github.com/mattjennings/react-modal-stack
 * License: MIT
 */

import React, { useCallback, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { Z_INDEX } from "../../../util/zIndexLayers";
import Background from "./Background";
import Drawer from "./Drawer";
import type { DrawerOptions, DrawerProps, DrawerState } from "./Drawer.types";
import { DrawerLivePropsProvider } from "./DrawerLivePropsContext";
import ModalStack from "./ModalStack";

import { ModalStackContext } from "./ModalStackContext";

export { useModals } from "./ModalStackContext";

import type {
  ModalOptions,
  ModalProps,
  ModalStackValue,
} from "./ModalStack.types";

export interface ModalStackProps {
  renderModals?: React.ComponentType<ModalStackValue>;
  children?: React.ReactNode;
}

const ModalStackWrapper = styled.div<{ abovePreview?: boolean }>`
  /* Above dropdown overlay so modals always open on top of select/combobox dropdowns (see util/zIndexLayers) */
  z-index: ${({ abovePreview }) =>
    abovePreview ? Z_INDEX.PREVIEW_OVERLAY + 1 : Z_INDEX.MODAL_STACK};
  position: fixed;
`;
const Modals = ({
  stack,
  closeModal,
  drawerState,
  closeDrawer,
}: ModalStackValue & {
  drawerState: DrawerState;
  closeDrawer: (options?: { id?: string }) => void;
}) => {
  const topModal = stack[stack.length - 1];
  const drawerZIndex = drawerState.drawer?.options?.zIndex ?? 100000;
  const topModalZIndex = topModal?.options?.zIndex ?? Z_INDEX.MODAL_STACK;
  const drawerIsTop =
    drawerState.isOpen &&
    drawerZIndex >= (topModal?.options?.zIndex ?? Number.NEGATIVE_INFINITY);
  const topIsViewportAnchored = drawerIsTop
    ? Boolean(drawerState.drawer?.options?.viewportRect)
    : Boolean(topModal?.options?.viewportRect);
  const baseZIndex = topIsViewportAnchored
    ? Z_INDEX.PREVIEW_OVERLAY + 1
    : Z_INDEX.MODAL_STACK;
  const wrapperZIndex = Math.max(
    baseZIndex,
    drawerState.isOpen ? drawerZIndex : Z_INDEX.MODAL_STACK,
    topModalZIndex,
  );
  const modalStackContainer =
    typeof document !== "undefined"
      ? document.getElementById("modal-stack")
      : null;
  return (
    <>
      <ModalStackWrapper style={{ zIndex: wrapperZIndex }}>
        <ModalStack stack={stack} closeModal={closeModal} />
        <Background stack={stack} closeModal={closeModal} />
      </ModalStackWrapper>
      <Drawer
        drawerState={drawerState}
        closeDrawer={closeDrawer}
        portalContainer={modalStackContainer}
      />
    </>
  );
};

const DefaultComponent = () => <div />;

const ModalProvider = ({ children }: ModalStackProps) => {
  const lastFocusedElementRef = useRef<Element | null>(null);

  const [stack, setStack] = useState<ModalProps[]>([]);
  const stackRef = useRef<ModalProps[]>([]);
  const currentDrawerRef = useRef<DrawerProps | null>(null);
  const [drawerState, setDrawerState] = useState<DrawerState>({
    isOpen: false,
    drawer: null,
  });
  const pause = React.useRef(false);
  const throttle = 1000;

  const setStackWithRef = useCallback(
    (updater: React.SetStateAction<ModalProps[]>) => {
      setStack((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (prev: ModalProps[]) => ModalProps[])(prev)
            : updater;
        stackRef.current = next;
        return next;
      });
    },
    [],
  );

  const closeAllModals = useCallback(() => {
    const currentStack = stackRef.current;
    setStackWithRef([]);
    return currentStack;
  }, [setStackWithRef]);

  const closeId = useCallback(
    (id: string, stack: ModalProps[]) => {
      const hasTargetModal = stack.some(({ options }) => options?.id === id);
      let shouldReleasePause = false;
      if (!pause.current && hasTargetModal) {
        setStackWithRef((prev) =>
          [...prev].filter(({ options }) => !(options?.id === id)),
        );
        pause.current = true;
        shouldReleasePause = true;
      }
      if (shouldReleasePause) {
        setTimeout(() => {
          pause.current = false;
        }, throttle);
      }
    },
    [setStackWithRef],
  );

  const closeModals = useCallback(
    (amount?: number) => {
      const currentStack = stackRef.current;
      let didClose = false;
      if (!pause.current) {
        if (currentStack.length === 1) {
          closeAllModals();
          didClose = true;
        } else {
          const closeAmount = amount || 1;
          if (currentStack.length > 0 && closeAmount > 0) {
            setStackWithRef((prev) =>
              [...prev].slice(0, prev.length - closeAmount),
            );
            didClose = true;
          }
        }
        if (didClose) {
          pause.current = true;
        }
      }
      if (didClose) {
        setTimeout(() => {
          pause.current = false;

          if (
            lastFocusedElementRef.current &&
            "focus" in lastFocusedElementRef.current
          ) {
            (lastFocusedElementRef.current as HTMLElement).focus();
          }
        }, throttle);
      }
      return currentStack;
    },
    [closeAllModals, setStackWithRef],
  );

  const openModal = useCallback(
    async (
      data: React.ReactElement | null,
      options?: ModalOptions,
      reset?: boolean,
    ) => {
      lastFocusedElementRef.current = document.activeElement;

      const { type, props } = data || <DefaultComponent />;
      if (type == null || typeof type === "undefined") {
        throw new Error("Modal type is undefined");
      }
      const modal = {
        type,
        props: { ...props, ...options },
        /** Explicit `openModal(..., options)` must win over element props (e.g. zIndex, id). */
        options: { ...props, ...options },
      };
      const { beforeOpen, afterOpen } = options || {};
      try {
        await beforeOpen?.();
        if (reset) closeAllModals();
        setStackWithRef((prev) => {
          let newStack = [...prev];

          if (options?.replace) newStack = prev.slice(0, prev.length - 1);
          // return [...newStack, modal as ModalProps];
          const uniqueIds = new Set();
          const uniqueStack = [...newStack, modal as ModalProps].filter(
            (modal) => {
              if (!uniqueIds.has(modal.options?.id)) {
                uniqueIds.add(modal.options?.id);
                return true;
              }
              return false;
            },
          );
          return uniqueStack.sort(
            (a, b) => (a.options?.zIndex ?? 0) - (b.options?.zIndex ?? 0),
          );
        });
        afterOpen?.();
        /**
         * This is necessary so that on popstate can close the modal.
         * @todo: optional is to pass props to the history state
         */
        window.history.pushState({}, "", "");
        return stack;
      } catch (error) {
        console.error(error);
        return stack;
      }
    },
    [stack, closeAllModals, setStackWithRef],
  );

  const closeModal = useCallback(
    async (props?: { id?: string }) => {
      const currentStack = stackRef.current;
      const { beforeClose, afterClose } =
        currentStack[currentStack.length - 1]?.options || {};
      try {
        await beforeClose?.(props);
        if (props?.id) {
          closeId(props?.id, currentStack);
        } else {
          closeModals(1);
        }
        afterClose?.(props);

        return currentStack;
      } catch (error) {
        console.error("Error in closeModal:", error);
        const errorMessage =
          error instanceof Error
            ? error.message || "Unknown error"
            : String(error) || "Unknown error";

        console.error(`Modal closing error: ${errorMessage}`);

        if (window.Sentry) {
          window.Sentry.captureException(error);
        }

        return currentStack;
      }
    },
    [closeId, closeModals],
  );

  const replaceModal = useCallback(
    (data: JSX.Element | null, options?: ModalOptions) => {
      return closeModal().then(() => openModal(data, options));
    },
    [closeModal, openModal],
  );

  const setModal = useCallback(
    (data: JSX.Element | null, options?: ModalOptions) =>
      openModal(data, options, true),
    [openModal],
  );

  const isModalOpen = useCallback(
    (id: string) => stack.some(({ options }) => options?.id === id),
    [stack],
  );
  const getDrawerOpen = useCallback(
    (id?: string) => {
      if (id) {
        return drawerState.drawer?.options?.id === id
          ? drawerState.drawer
          : null;
      }
      return drawerState.isOpen ? drawerState.drawer : null;
    },
    [drawerState.drawer, drawerState.isOpen],
  );

  let closeTimeout: NodeJS.Timeout;
  const animationDuration = 400;

  // biome-ignore lint/correctness/useExhaustiveDependencies: no need to depend on closeTimeout
  const openDrawer = useCallback(
    async (element: JSX.Element | null, options?: DrawerOptions) => {
      if (!element) return;

      const drawer: DrawerProps = {
        element,
        options: {
          side: "left",
          width: 460,
          // Default: no backdrop unless explicitly enabled
          overlay: false,
          ...options,
        },
      };

      if (options?.replace && currentDrawerRef.current) {
        setDrawerState({
          isOpen: false,
          drawer: currentDrawerRef.current,
        });
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (closeTimeout) clearTimeout(closeTimeout);
      setDrawerState({
        isOpen: true,
        drawer,
      });
      currentDrawerRef.current = drawer;

      // Handle beforeOpen callback
      options?.beforeOpen?.();

      // Add to browser history for back button support
      window.history.pushState({}, "", "");

      await new Promise((resolve) => setTimeout(resolve, animationDuration));
      options?.afterOpen?.();
      return options;
    },
    [],
  );

  const closeDrawer = useCallback(async (options?: { id?: string }) => {
    const currentDrawer = options?.id
      ? currentDrawerRef.current?.options?.id === options?.id
        ? currentDrawerRef.current
        : null
      : currentDrawerRef.current;

    if (!currentDrawer) return;

    // Handle beforeClose callback
    currentDrawer?.options?.beforeClose?.();

    // Only set isOpen false – keep drawer so useTransition can run leave animation
    setDrawerState({
      isOpen: false,
      drawer: currentDrawer ?? null,
    });

    // After leave animation completes, clear drawer and run afterClose

    await new Promise((resolve) => {
      closeTimeout = setTimeout(resolve, animationDuration);
    });

    setDrawerState({
      isOpen: false,
      drawer: null,
    });
    currentDrawerRef.current = null;
    currentDrawer?.options?.afterClose?.();
    return options;
  }, []);

  const value = useMemo(() => {
    return {
      stack,
      setModal,
      openModal,
      openDrawer,
      closeDrawer,
      replaceModal,
      closeModal,
      closeModals,
      closeAllModals,
      isModalOpen,
      getDrawerOpen,
    };
  }, [
    stack,
    setModal,
    openModal,
    openDrawer,
    closeDrawer,
    replaceModal,
    closeModal,
    closeModals,
    closeAllModals,
    isModalOpen,
    getDrawerOpen,
  ]);

  React.useEffect(() => {
    window.onpopstate = (e: PopStateEvent) => {
      e.preventDefault();
      if (drawerState.isOpen) {
        closeDrawer();
      } else if (stack.length >= 1) {
        value.closeModal();
      }
    };
  }, [stack, drawerState.isOpen, closeDrawer, value.closeModal]);

  return (
    <ModalStackContext.Provider value={value} key="modal-stack-provider">
      <DrawerLivePropsProvider
        modals={
          <Modals
            {...value}
            drawerState={drawerState}
            closeDrawer={closeDrawer}
          />
        }
      >
        {children}
      </DrawerLivePropsProvider>
    </ModalStackContext.Provider>
  );
};

export default ModalProvider;
