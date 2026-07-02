/** @format */

import type { DialogContentProps } from "@radix-ui/react-dialog";
import type React from "react";

export interface DrawerOptions {
  id?: string;
  zIndex?: number;
  title?: string;
  width?: number; // Default will be 420px
  side?: "left" | "right"; // Default will be left
  /**
   * Override the viewport that the drawer should treat as "the screen".
   * Useful for previews (e.g. tablet/desktop emulation) where the drawer should
   * be constrained to a specific rectangle on the page.
   */
  viewportRect?: { top: number; left: number; width: number; height: number };
  overlay?: boolean; // Whether to show dark overlay
  replace?: boolean;
  onClose?: false | (() => void);
  closeDrawer?: () => void;
  onPointerDownOutside?: DialogContentProps["onPointerDownOutside"];
  preventClose?: boolean;
  closeButtonVariant?: "basic" | "outline" | "shapeless" | "white";
  beforeOpen?: (props?: unknown) => Promise<void> | void;
  afterOpen?: (props?: unknown) => Promise<void> | void;
  beforeClose?: (props?: unknown) => Promise<void> | void;
  afterClose?: (props?: unknown) => Promise<void> | void;
  children?: React.ReactNode | React.ReactNode[];
  className?: string;
}

export interface DrawerProps {
  element: React.ReactElement<Record<string, unknown>>;
  options?: DrawerOptions;
}

export interface DrawerState {
  isOpen: boolean;
  drawer: DrawerProps | null;
}
