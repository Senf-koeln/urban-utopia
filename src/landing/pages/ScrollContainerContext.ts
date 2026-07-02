import { createContext, useContext } from "react";
import type { RefObject } from "react";

export const ScrollContainerContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null);

export function useScrollContainer() {
  return useContext(ScrollContainerContext);
}
