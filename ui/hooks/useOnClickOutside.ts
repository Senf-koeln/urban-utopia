/** @format */

import React, { type RefObject } from "react";

import useEventListener from "./useEventListener";

type Handler<R extends HTMLElement = HTMLElement> = (
  event: MouseEvent & {
    target: R;
  },
) => void;

export const useOnClickOutside = <
  T extends HTMLElement = HTMLElement,
  R extends HTMLElement = HTMLElement,
>(
  ref: RefObject<T | null>,
  handler: Handler<R>,
  options?: {
    mouseEvent?: "mousedown" | "mouseup";
    ignore?: RefObject<T | null>[];
    contain?: RefObject<T | null>;
  },
): void => {
  useEventListener(options?.mouseEvent || "mousedown", (event) => {
    const el = ref?.current;

    // Do nothing if clicking ref's element or descendent elements
    if (
      !el ||
      el.contains(event.target as Node) ||
      options?.ignore?.some((el) =>
        el.current?.contains(event.target as Node),
      ) ||
      (options?.contain &&
        !options?.contain?.current?.contains(event.target as Node))
    ) {
      return;
    }

    handler(event);
  });
};

export const useOnClickAndTouchOutside = (ref, handler) => {
  React.useEffect(
    () => {
      const listener = (event) => {
        // Do nothing if clicking ref's element or descendent elements
        if (!ref.current || ref.current.contains(event.target)) {
          return;
        }
        handler(event);
      };
      document.addEventListener("mousedown", listener);
      document.addEventListener("touchstart", listener);
      return () => {
        document.removeEventListener("mousedown", listener);
        document.removeEventListener("touchstart", listener);
      };
    },
    // Add ref and handler to effect dependencies
    // It's worth noting that because passed in handler is a new ...
    // ... function on every render that will cause this effect ...
    // ... callback/cleanup to run every render. It's not a big deal ...
    // ... but to optimize you can wrap handler in useCallback before ...
    // ... passing it into this hook.
    [ref, handler],
  );
};
