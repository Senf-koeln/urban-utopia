import * as React from "react";
import { useTranslation } from "react-i18next";
import { useMagneticCursor } from "@shared";
import { tv, type VariantProps } from "tailwind-variants";
import { v4 as uuidv4 } from "uuid";
import { cn } from "../../../util/classNameConstructor";
import Icon, { type IconProps } from "../icon/Icon";
import type { IconName } from "../icon/names";
import TooltipProvider, {
  type TooltipProviderProps,
} from "../tooltip/TooltipProvider";

export const ButtonVariant = tv({
  slots: {
    base: [
      "group/button pointer-events-auto relative flex w-fit items-center justify-center",
      "text-text-default",
      "font-semibold text-base leading-none no-underline",
      "ring-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black",
      "rounded-xl transition-[color,background-color,box-shadow] duration-200 ease-out",
    ],
    prefix: [
      "font-semibold text-text-subdued",
      "no-touch:group-hover/button:text-[var(--primary-800)] group-active/button:text-[var(--primary-800)]",
      "ms-2",
    ],
    icon: ["shrink-0 text-inherit"],
    text: "mx-2",
    spinner: ["shrink-0 text-inherit"],
  },
  variants: {
    variant: {
      basic:
        "bg-action-secondary-default no-touch:hover:bg-action-secondary-hovered touch-any:active:bg-action-secondary-pressed",
      primary:
        "text-text-on-primary no-touch:hover:text-text-on-primary touch-any:active:text-text-on-primary bg-action-primary-default no-touch:hover:bg-action-primary-hovered touch-any:active:bg-action-primary-pressed font-bold",
      white:
        "bg-surface-default no-touch:hover:bg-action-tertiary-hovered touch-any:active:bg-action-tertiary-pressed",
      outline:
        "bg-transparent no-touch:hover:bg-action-secondary-hovered touch-any:active:bg-action-secondary-pressed ring-1 ring-border-default no-touch:hover:ring-border-hovered touch-any:active:ring-border-pressed",
      shapeless:
        "bg-transparent no-touch:hover:bg-action-secondary-hovered touch-any:active:bg-action-secondary-pressed",
      shadow:
        "bg-white shadow-lg no-touch:hover:shadow-md touch-any:active:shadow no-touch:hover:bg-action-secondary-hovered touch-any:active:bg-action-secondary-pressed ring-inset ring-2 ring-white",
    },
    size: {
      xl: "h-14 p-4",
      lg: "h-11 p-3",
      md: "h-9 p-2",
      sm: "h-7 p-1 text-sm",
    },
    square: {
      true: "aspect-square",
    },
    pillShaped: {
      true: {
        base: "rounded-full",
      },
      false: {
        base: "rounded-xl",
        text: "mx-1.5",
      },
    },
    disabled: {
      true: {
        base: "pointer-events-none text-text-disabled",
      },
    },
    critical: {
      true: {
        base: "text-text-critical no-touch:hover:text-text-critical touch-any:active:text-text-critical no-touch:hover:bg-surface-critical-subdued-hovered touch-any:active:bg-surface-critical-subdued-pressed font-bold",
        icon: "no-touch:hover:text-icon-critical touch-any:active:text-icon-critical",
      },
    },
    width: {
      max: "w-full",
    },
    textSubdued: {
      true: "text-text-subdued no-touch:hover:text-[var(--primary-800)] touch-any:active:text-[var(--primary-800)]",
    },
    isLogo: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    // Critical state overrides
    {
      variant: "basic",
      critical: true,
      class: {
        base: ["bg-surface-critical-subdued"],
      },
    },
    {
      variant: "primary",
      critical: true,
      class: {
        base: [
          "text-text-on-critical no-touch:hover:text-text-on-critical touch-any:active:text-text-on-critical",
          "bg-action-critical-default no-touch:hover:bg-action-critical-hovered touch-any:active:bg-action-critical-pressed",
        ],
      },
    },
    {
      variant: "outline",
      critical: true,
      class: {
        base: [
          "text-text-critical",
          "no-touch:hover:bg-surface-critical-subdued-hovered touch-any:active:bg-surface-critical-subdued-pressed",
          "ring-border-critical-default no-touch:hover:ring-border-critical-default touch-any:active:ring-border-critical-default",
        ],
        spinner: "text-icon-critical",
        icon: "text-icon-critical",
      },
    },
    // TextSubdued overrides
    {
      variant: "primary",
      textSubdued: true,
      class:
        "text-[var(--primary-800)] bg-[var(--primary-200)] no-touch:hover:bg-[var(--primary-300)] touch-any:active:bg-[var(--primary-400)]",
    },
    // Disabled state overrides
    {
      disabled: true,
      textSubdued: true,
      class: {
        base: "text-text-disabled",
      },
    },
    {
      disabled: true,
      critical: true,
      class: {
        base: "text-text-disabled",
      },
    },
    {
      variant: "primary",
      disabled: true,
      class: {
        base: "bg-action-primary-disabled",
      },
    },
    {
      variant: "basic",
      disabled: true,
      class: {
        base: "bg-action-secondary-disabled",
      },
    },
    {
      variant: "outline",
      disabled: true,
      class: {
        base: "ring-border-disabled",
      },
    },
    {
      variant: "primary",
      isLogo: true,
      class: {
        base: "[&_path]:fill-current",
      },
    },
  ],
  defaultVariants: {
    variant: "basic",
    pillShaped: true,
    square: false,
    size: "md",
    isLogo: false,
  },
});

export interface ButtonProps
  extends Omit<VariantProps<typeof ButtonVariant>, "square">,
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "dir" | "onClick"> {
  text?: string | React.JSX.Element;
  "aria-label"?: string;
  leadingIcon?: IconName | React.JSX.Element;
  trailingIcon?: IconName | React.JSX.Element;
  leadingIconProps?: Partial<IconProps>;
  trailingIconProps?: Partial<IconProps>;
  loading?: boolean;
  disabled?: boolean;
  critical?: boolean;
  textSubdued?: boolean;
  disabledNotice?: string;
  throttle?: number;
  trackId?: string;
  dataCy?: string;
  square?: boolean;
  classNameWrapper?: string;
  classNames?: {
    wrapper?: string;
    children?: string;
    text?: string;
    spinner?: string;
    leadingIcon?: string;
    trailingIcon?: string;
  };
  tooltipLabel?: string | Element | React.ReactNode;
  children?: React.ReactNode | React.ReactNode[];
  tag?: "button" | "a" | "span" | "div";
  tooltipProps?: Omit<TooltipProviderProps, "children">;
  onClick?: TooltipProviderProps["onClick"];
}

const ButtonComponent = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement | HTMLDivElement | HTMLSpanElement,
  ButtonProps
>(
  (
    {
      id,
      trackId,
      className,
      width,
      loading,
      leadingIcon,
      trailingIcon,
      leadingIconProps,
      trailingIconProps,
      pillShaped,
      onClick,
      dataCy,
      tooltipLabel,
      text,
      children,
      variant,
      disabled,
      critical,
      disabledNotice,
      classNameWrapper,
      classNames,
      role,
      square = false,
      size = "md",
      tag = "button",
      prefix,
      tooltipProps,
      textSubdued,
      ...props
    },
    ref,
  ) => {
    const buttonId = React.useRef(id || trackId || `tooltip-${uuidv4()}`);
    const reference = React.useRef<
      HTMLButtonElement | HTMLAnchorElement | HTMLDivElement | HTMLSpanElement
    >(null);

    // useMagneticCursor(reference, {
    //   strength: 0.2,
    //   radius: 100,
    //   enabled: magnetic && !disabled,
    //   smoothness: 0.15,
    // });

    const leading = leadingIcon && loading ? "loading" : leadingIcon;
    const trailing =
      trailingIcon && !leadingIcon && loading ? "loading" : trailingIcon;
    const spinner = loading && !(leading || trailing);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent) => {
        if (
          (event.key === "Enter" || event.key === " ") &&
          onClick &&
          typeof onClick === "function" &&
          !disabled
        ) {
          event.preventDefault();
          onClick(event);
        }
      },
      [onClick, disabled],
    );

    const rotateIcon = React.useCallback(
      (icon: ButtonProps["leadingIcon"] | ButtonProps["trailingIcon"]) => {
        if (
          (icon?.toString()?.includes("-left") ||
            icon?.toString()?.includes("-right")) &&
          document.dir === "rtl"
        ) {
          return "rotate-180";
        }
        return "";
      },
      [],
    );

    const Component = tag;
    const buttonClasses = ButtonVariant({
      disabled: !!disabled,
      critical: !!critical,
      size,
      square:
        square ||
        (!text && !children && !!(leadingIcon ? !trailingIcon : trailingIcon)),
      variant,
      pillShaped,
      width,
      textSubdued: !!textSubdued,
      isLogo: leading?.toString().includes("logo/"),
    });

    const Item = (
      <Component
        data-cy={dataCy}
        id={buttonId.current}
        ref={ref || reference}
        type={tag === "button" ? "button" : undefined}
        role={tag !== "button" ? "button" : role}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={
          tooltipLabel ?? (typeof text === "string" ? text : undefined)
        }
        aria-disabled={disabled}
        disabled={disabled}
        className={cn(
          buttonClasses.base(),
          className,
          trackId && `button umami--click--${trackId}`,
        )}
        {...props}
      >
        {prefix && <span className={cn(buttonClasses.prefix())}>{prefix}</span>}
        {leading && (
          <Icon
            key={typeof leading === "string" ? leading : undefined}
            {...leadingIconProps}
            name={leading}
            aria-hidden="true"
            className={cn(
              buttonClasses.icon(),
              leadingIconProps?.className,
              !!(children || text) && "translate-x-0.5",
              rotateIcon(leading) && "rotate-180",
              classNames?.leadingIcon,
            )}
          />
        )}
        {children && (
          <span className={cn(buttonClasses.text(), classNames?.children)}>
            {children}
          </span>
        )}
        {spinner && (
          <Icon
            name="loading"
            className={cn(
              buttonClasses.spinner(),
              text ? "absolute" : "",
              classNames?.spinner,
            )}
          />
        )}
        {text && (
          <span
            style={{ opacity: spinner ? 0 : 1 }}
            className={cn(buttonClasses.text(), classNames?.text)}
          >
            {text}
          </span>
        )}
        {trailing && (
          <Icon
            {...trailingIconProps}
            name={trailing}
            aria-hidden="true"
            className={cn(
              buttonClasses.icon(),
              trailingIconProps?.className,
              !!(children || text) && "-translate-x-0.5",
              rotateIcon(trailing) && "rotate-180",
              children || text ? "ms-auto" : "",
              leading && !(children || text) && "ms-1",
              classNames?.trailingIcon,
            )}
          />
        )}
      </Component>
    );

    return (
      <TooltipProvider
        critical={!!disabled && !!disabledNotice}
        disabled={disabled}
        primaryContent={
          ((disabled && disabledNotice) || tooltipLabel) as
            | React.ReactNode
            | string
        }
        noTooltip={!tooltipLabel && !disabled}
        onClick={onClick}
        className={cn(
          classNameWrapper,
          classNames?.wrapper,
          width === "max" && "w-full",
          disabled && "cursor-not-allowed",
        )}
        id={id}
        tooltipProps={tooltipProps}
      >
        {Item}
      </TooltipProvider>
    );
  },
);

ButtonComponent.displayName = "Button";
const Button = React.memo(ButtonComponent);
export default Button;
