/** @format */

import { useSyncExternalStore } from "react";

export const useIsMobile = () => {
  const { innerWidth } = useSyncExternalStore(
    subscribeToWindowDimensions,
    getWindowDimensionsSnapshot,
    getWindowDimensionsServerSnapshot,
  );

  return innerWidth <= 768;
};

export const useIsHorizontal = () => {
  const { innerWidth, innerHeight } = useSyncExternalStore(
    subscribeToWindowDimensions,
    getWindowDimensionsSnapshot,
    getWindowDimensionsServerSnapshot,
  );

  return innerWidth > innerHeight;
};

type WindowDimensionsSnapshot = {
  innerWidth: number;
  innerHeight: number;
};

const DEFAULT_SERVER_SNAPSHOT: WindowDimensionsSnapshot = {
  innerWidth: 1024,
  innerHeight: 768,
};

let latestSnapshot: WindowDimensionsSnapshot =
  typeof window === "undefined"
    ? DEFAULT_SERVER_SNAPSHOT
    : {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
      };

const listeners = new Set<() => void>();
let isListening = false;

const notify = () => {
  for (const listener of listeners) listener();
};

const handleResize = () => {
  const next: WindowDimensionsSnapshot = {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
  };

  if (
    next.innerWidth === latestSnapshot.innerWidth &&
    next.innerHeight === latestSnapshot.innerHeight
  ) {
    return;
  }

  latestSnapshot = next;
  notify();
};

function subscribeToWindowDimensions(listener: () => void) {
  listeners.add(listener);

  if (!isListening && typeof window !== "undefined") {
    window.addEventListener("resize", handleResize);
    isListening = true;
  }

  return () => {
    listeners.delete(listener);
    if (isListening && listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("resize", handleResize);
      isListening = false;
    }
  };
}

function getWindowDimensionsSnapshot() {
  return latestSnapshot;
}

function getWindowDimensionsServerSnapshot() {
  return DEFAULT_SERVER_SNAPSHOT;
}
