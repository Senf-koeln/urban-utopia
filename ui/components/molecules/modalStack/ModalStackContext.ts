/**
 * Modal stack context and useModals hook.
 *
 * Kept in a separate .ts file for HMR stability:
 * - Vite Fast Refresh works best when .tsx files export only components.
 *   Exporting useModals (a hook) alongside ModalProvider causes "Could not Fast Refresh"
 *   and full page reloads that lose context.
 * - Stashing the context in globalThis ensures the same context object survives
 *   module re-execution during HMR, even when this file is edited.
 */

import React, { useContext } from "react";
import type { ModalStackValue } from "./ModalStack.types";

const defaultContextValue: ModalStackValue = {
  stack: [],
  setModal: async () => [],
  openModal: async () => [],
  openDrawer: async () => {},
  closeDrawer: async () => {},
  replaceModal: async () => [],
  closeModal: async () => [],
  closeModals: () => [],
  closeAllModals: () => [],
  isModalOpen: () => false,
  getDrawerOpen: () => null,
};

const CONTEXT_KEY = "__MODAL_STACK_CONTEXT__" as const;

// Stash in globalThis so context survives HMR - module re-execution reuses the
// same context object instead of creating a new one, keeping Provider and
// consumers aligned.
function getModalStackContext(): React.Context<ModalStackValue> {
  if (typeof globalThis !== "undefined") {
    const g = globalThis as unknown as Record<
      string,
      React.Context<ModalStackValue> | undefined
    >;
    let ctx = g[CONTEXT_KEY];
    if (!ctx) {
      ctx = React.createContext<ModalStackValue>(defaultContextValue);
      g[CONTEXT_KEY] = ctx;
    }
    return ctx;
  }
  return React.createContext<ModalStackValue>(defaultContextValue);
}

const ModalStackContext = getModalStackContext();

export { ModalStackContext, defaultContextValue };

export const useModals = () => useContext(ModalStackContext);
