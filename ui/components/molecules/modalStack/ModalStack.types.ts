/** @format */

import type React from "react";
import type { RefObject } from "react";
import type { Sizes } from "../../../styles/theme";
import type { ButtonProps } from "../../core/button/Button";
import type { DrawerProps, DrawerState } from "./Drawer.types";

export interface ModalOptions {
  id?: string;
  zIndex?: number;
  title?: string;
  ariaTitle?: string;
  description?: string;
  modalPayload?: any;
  modalHandle?: boolean;
  onSubmit?: (
    payload?: ModalOptions["modalPayload"],
  ) => any | void | Promise<void> | Promise<any>;
  onClose?: false | (() => void);
  // this can be used to subscribe to the submit event from within the modal component
  subscriptions?: RefObject<
    Partial<{
      onSubmit?: ModalOptions["onSubmit"];
    }>
  >;
  closeModal?: () => void;
  preventClose?: boolean;
  setOpacity?: (opacity: number) => void;
  index?: number;
  submitDisabled?: boolean;
  submitText?: string;
  submitLoading?: boolean;
  critical?: boolean;
  cancelVariant?: ButtonProps["variant"];
  cancelText?: string;
  size?: Sizes[keyof Sizes];
  color?: string;
  height?: number;
  width?: number;
  /**
   * Override the viewport that the modal should treat as "the screen".
   * This affects max-height calculations (and swipe-to-close thresholds).
   */
  /** Screen-space bounds (e.g. from getBoundingClientRect). `x`/`y` accepted as aliases for `left`/`top`. */
  viewportRect?: {
    top?: number;
    left?: number;
    width: number;
    height: number;
    x?: number;
    y?: number;
  };
  classNames?: {
    outer?: string;
    inner?: string;
  };
  children?: React.ReactNode | React.ReactNode[];
  // height?: number;
  swipe?: boolean;
  enterFrom?: "top" | "bottom" | "left" | "right";
  style?: React.CSSProperties;
  overflow?: React.CSSProperties["overflow"];
  replace?: boolean;
  beforeOpen?: (props?: any) => Promise<void> | void;
  afterOpen?: (props?: any) => Promise<void> | void;
  beforeClose?: (props?: any) => Promise<void> | void;
  afterClose?: (props?: any) => Promise<void> | void;
  isMobile?: boolean;
  maxHeight?: number;
  transform?:
    | {
        [key in "scale" | "y" | "x"]?: ((index: number) => number) | boolean;
      }
    | boolean;
  closeButtonVariant?: "basic" | "outline" | "shapeless" | "white";
  transformIn?: boolean;
  /** Dimming strength for the stack backdrop (0–1). Default 0.5. */
  backdropOpacity?: number;
}

export interface ModalProps {
  type: React.ComponentType;
  props: React.HTMLProps<HTMLElement>;
  options?: ModalOptions;
}

export interface ModalContainerProps {
  item: ModalProps;
  index: number;
  style?: React.CSSProperties & { shading: number; y: number };
  closeModal: () => void;
}
export interface ModalStackValue {
  stack: ModalProps[];
  /**
   * Opens a modal using the provided component, clearing all open modals
   */
  setModal: (
    modal: React.ComponentElement<
      ModalProps,
      React.Component<ModalProps>
    > | null,
    options?: ModalOptions,
  ) => Promise<ModalProps[]>;
  /**
   * Opens a modal using the provided component, on top of the stack
   */
  openModal: (
    modal: React.ComponentElement<
      ModalProps,
      React.Component<ModalProps>
    > | null,
    options?: ModalOptions,
  ) => Promise<ModalProps[]>;

  /**
   * Opens a drawer sliding from the side
   */
  openDrawer: (
    element: React.ReactElement | null,
    options?: import("./Drawer.types").DrawerOptions,
  ) => Promise<void>;

  /**
   * Closes the active drawer
   */
  closeDrawer: (options?: { id?: string }) => Promise<void>;

  replaceModal: (
    modal: React.ComponentElement<
      ModalProps,
      React.Component<ModalProps>
    > | null,
    options?: ModalOptions,
  ) => Promise<ModalProps[]>;

  /**
   * Closes the active modal
   */
  closeModal: (options?: { id: string }) => Promise<ModalProps[]>;

  /**
   * Closes the number of modals
   */
  closeModals: (amount?: number) => ModalProps[];

  /**
   * Closes all modals
   */
  closeAllModals: () => ModalProps[];

  /**
   * Checks if a modal with the given id is open
   */
  isModalOpen: (id: string) => boolean;

  /**
   * Checks if a drawer with the given id is open
   */
  getDrawerOpen: (id?: string) => DrawerProps | null;
}
