/** @format */

import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";

type LivePropsMap = Map<string, Record<string, unknown>>;

export type DrawerLiveRegistryContextValue = {
  propsMapRef: React.MutableRefObject<LivePropsMap>;
  requestDrawerContentRepaint: () => void;
};

/** Stable: registering components must not re-render when the drawer repaints. */
const DrawerLiveRegistryContext =
  createContext<DrawerLiveRegistryContextValue | null>(null);

/** Only portaled modals subscribe; bumps when live drawer props change. */
const DrawerRepaintTickContext = createContext<number>(0);

export function useDrawerLiveRegistry() {
  return useContext(DrawerLiveRegistryContext);
}

export function useDrawerRepaintTick() {
  return useContext(DrawerRepaintTickContext);
}

/**
 * Wraps app `children` with the live-props registry and renders `modals` in a
 * portal wrapped with a repaint tick provider so only the modal subtree
 * re-renders on tick (not every screen that registers live props).
 */
export function DrawerLivePropsProvider({
  children,
  modals,
}: {
  children: React.ReactNode;
  modals: React.ReactNode;
}) {
  const propsMapRef = useRef<LivePropsMap>(new Map());
  const [repaintTick, setRepaintTick] = useState(0);
  const requestDrawerContentRepaint = useCallback(() => {
    setRepaintTick((t) => t + 1);
  }, []);

  const registryValue = useMemo(
    () => ({
      propsMapRef,
      requestDrawerContentRepaint,
    }),
    [requestDrawerContentRepaint],
  );

  return (
    <DrawerLiveRegistryContext.Provider value={registryValue}>
      {children}
      {ReactDOM.createPortal(
        <DrawerRepaintTickContext.Provider value={repaintTick}>
          {modals}
        </DrawerRepaintTickContext.Provider>,
        document.body,
      )}
    </DrawerLiveRegistryContext.Provider>
  );
}

/**
 * Writes `liveProps` into a shared ref for the Drawer to merge on each paint,
 * and requests a Drawer repaint when `liveProps` identity changes while active.
 */
export function useRegisterDrawerLiveProps(
  drawerId: string,
  isActive: boolean,
  liveProps: Record<string, unknown>,
) {
  const registry = useDrawerLiveRegistry();
  const requestRepaint = registry?.requestDrawerContentRepaint;

  if (registry) {
    if (isActive) {
      registry.propsMapRef.current.set(drawerId, liveProps);
    } else {
      registry.propsMapRef.current.delete(drawerId);
    }
  }

  useLayoutEffect(() => {
    if (!isActive || !requestRepaint) return;
    requestRepaint();
  }, [isActive, liveProps, requestRepaint]);
}
