/** @format */

import { useEffect, useRef, useState } from "react";

const round2 = (n: number) => Math.round(n * 100) / 100;

function boundsEqual(
  a: { left: number; top: number; width: number; height: number },
  b: { left: number; top: number; width: number; height: number },
) {
  return (
    round2(a.left) === round2(b.left) &&
    round2(a.top) === round2(b.top) &&
    round2(a.width) === round2(b.width) &&
    round2(a.height) === round2(b.height)
  );
}

function sizeEqual(
  a: { width: number; height: number },
  b: { width: number; height: number },
) {
  return (
    round2(a.width) === round2(b.width) && round2(a.height) === round2(b.height)
  );
}

type MeasureOptions = { trackPosition?: boolean };

type MeasureCallback<P extends unknown[]> = (
  rect: DOMRectReadOnly,
  ...props: P
) => void;

export function useMeasure<T extends Element, P extends unknown[] = []>(
  optionsOrCallback?: MeasureOptions | MeasureCallback<P>,
  callbackOrProp?: MeasureCallback<P> | unknown,
  ...restProps: unknown[]
) {
  const options =
    typeof optionsOrCallback === "function" || optionsOrCallback === undefined
      ? {}
      : optionsOrCallback;
  const callback =
    typeof optionsOrCallback === "function"
      ? optionsOrCallback
      : typeof callbackOrProp === "function"
        ? callbackOrProp
        : undefined;
  const props = (
    typeof optionsOrCallback === "function" || optionsOrCallback === undefined
      ? [callbackOrProp, ...restProps]
      : restProps
  ).filter((p) => p !== undefined) as P;
  const { trackPosition = false } = options;
  const ref = useRef<T>(null);
  const [bounds, set] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const callbackRef = useRef(callback);
  const propsRef = useRef(props);
  const boundsRef = useRef(bounds);
  const rafIdRef = useRef<number | null>(null);

  // Update refs when callback or props change
  callbackRef.current = callback;
  propsRef.current = props;
  boundsRef.current = bounds;

  useEffect(() => {
    const updateBounds = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const newBounds = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };
      callbackRef.current?.(newBounds as DOMRectReadOnly, ...propsRef.current);
      // Allow size-only tracking to avoid rerenders from position-only scroll changes.
      const hasChanged = trackPosition
        ? !boundsEqual(boundsRef.current, newBounds)
        : !sizeEqual(boundsRef.current, newBounds);
      if (hasChanged) {
        boundsRef.current = newBounds;
        set(newBounds);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateBounds();
    });

    // Throttle scroll/resize via rAF so we don't re-render every scroll tick
    const scheduleUpdate = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        updateBounds();
      });
    };

    const parentElements: (Element | null)[] = [];

    // Initial measurement
    const timeoutId = setTimeout(() => {
      if (ref.current) {
        updateBounds();
        resizeObserver.observe(ref.current);

        window.addEventListener("scroll", scheduleUpdate, true);
        window.addEventListener("resize", scheduleUpdate);

        let parent = ref.current.parentElement;
        while (parent) {
          parentElements.push(parent);
          parent.addEventListener("scroll", scheduleUpdate, true);
          parent = parent.parentElement;
        }
      }
    });

    return () => {
      clearTimeout(timeoutId);
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", scheduleUpdate, true);
      window.removeEventListener("resize", scheduleUpdate);

      parentElements.forEach((parent) => {
        if (parent) {
          parent.removeEventListener("scroll", scheduleUpdate, true);
        }
      });
    };
  }, [trackPosition]);

  return [{ ref }, bounds] as const;
}
