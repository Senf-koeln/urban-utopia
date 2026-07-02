"use client";

import * as React from "react";
import { forwardRef } from "react";
import { Icon } from "../../..";
import { cn } from "../../../util/classNameConstructor";
import type { IconName } from "../icon/names";
import type { TooltipProviderProps } from "../tooltip/TooltipProvider";
import TooltipProvider from "../tooltip/TooltipProvider";
import { inputVariants } from "./inputVariants";

export interface InputTriggerWrapperProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  label?: string;
  labelOutside?: boolean;
  shouldFloat?: boolean;
  leadingIcon?: IconName | React.ReactNode;
  leadingIconProps?: React.HTMLAttributes<HTMLDivElement> & {
    label?: TooltipProviderProps["primaryContent"];
  };
  trailingIcon?: IconName | React.ReactNode;
  trailingIconProps?: React.HTMLAttributes<HTMLDivElement> & {
    label?: TooltipProviderProps["primaryContent"];
  };
  prepend?: React.ReactNode;
  append?: React.ReactNode;
  trailingSlot?: React.ReactNode;
  helper?: string | boolean;
  error?: string | boolean;
  success?: string | boolean;
  size?: "md" | "lg" | "xl";
  disabled?: boolean;
  hasError?: boolean;
  hasSuccess?: boolean;
  inputId?: string;
  onLabelClick?: () => void;
  /** Event handlers for the input container (e.g. onClick/onMouseDown for focus) */
  inputContainerProps?: React.HTMLAttributes<HTMLDivElement>;
  /** Optional custom helper block (e.g. for character counter layout) */
  helperBlock?: React.ReactNode;
  /**
   * When provided, only the input container div is wrapped by the returned element (e.g. Radix Trigger).
   * Helper/error text is rendered outside so clicking them does not open dropdowns.
   */
  triggerWrapper?: (triggerElement: React.ReactElement) => React.ReactNode;
  /** Variant overrides for Input-specific use cases */
  isRich?: boolean;
  type?:
    | "email"
    | "password"
    | "search"
    | "tel"
    | "text"
    | "url"
    | "textarea"
    | "number";
  silent?: boolean;
  classNames?: {
    container?: string;
    inputContainer?: string;
    inputWrapper?: string;
    label?: string;
    leadingIcon?: string;
    leadingIconWrapper?: string;
    trailingIcon?: string;
    trailingIconWrapper?: string;
    helperText?: string;
  };
  children: React.ReactNode;
}

const InputTriggerWrapper = forwardRef<
  HTMLDivElement,
  InputTriggerWrapperProps
>(
  (
    {
      label,
      labelOutside = false,
      shouldFloat = false,
      leadingIcon,
      leadingIconProps,
      trailingIcon,
      trailingIconProps,
      prepend,
      append,
      trailingSlot,
      helper,
      error,
      success,
      size = "lg",
      disabled,
      hasError = false,
      hasSuccess = false,
      inputId,
      onLabelClick,
      inputContainerProps,
      helperBlock,
      triggerWrapper,
      isRich,
      type,
      silent,
      classNames,
      children,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    const variantClasses = React.useMemo(
      () =>
        inputVariants({
          size,
          hasError,
          hasSuccess,
          hasLeadingIcon: Boolean(leadingIcon),
          hasTrailingIcon: Boolean(trailingIcon),
          hasStepper: Boolean(trailingSlot),
          isFloating: shouldFloat,
          hasLabel: !!label,
          trailingIconClickable: Boolean(trailingIconProps?.onClick),
          labelOutside,
          isRich: Boolean(isRich),
          type,
          silent: Boolean(silent),
          disabled: Boolean(disabled),
        }),
      [
        size,
        hasError,
        hasSuccess,
        leadingIcon,
        trailingIcon,
        trailingSlot,
        shouldFloat,
        label,
        trailingIconProps?.onClick,
        labelOutside,
        isRich,
        type,
        silent,
        disabled,
      ],
    );

    const {
      container: containerClasses,
      inputContainer: inputContainerClasses,
      inputWrapper: inputWrapperClasses,
      label: labelClasses,
      leadingIcon: leadingIconClasses,
      leadingIconWrapper: leadingIconWrapperClasses,
      trailingIcon: trailingIconClasses,
      trailingIconWrapper: trailingIconWrapperClasses,
      helperText: helperTextClasses,
    } = variantClasses;

    const descriptionText =
      (typeof error === "string" && error) ||
      (typeof success === "string" && success) ||
      (typeof helper === "string" && helper);

    const renderIcon = React.useCallback(
      (position: "leading" | "trailing", wrapperClassName?: string) => {
        const icon = position === "leading" ? leadingIcon : trailingIcon;
        const iconProps =
          position === "leading" ? leadingIconProps : trailingIconProps;
        const iconClasses =
          position === "leading" ? leadingIconClasses : trailingIconClasses;

        if (!icon) return null;

        const tooltipLabel = iconProps?.label;
        const isInteractive = Boolean(iconProps?.onClick) && !disabled;
        const IconContent =
          typeof icon === "string" ? (
            <Icon
              name={icon as IconName}
              className={cn("h-[1.125em] w-5 fill-current")}
              aria-hidden="true"
            />
          ) : (
            icon
          );

        const iconElement = (
          // biome-ignore lint/a11y/noStaticElementInteractions: icon wrapper needs mouse events for clickable icons
          // biome-ignore lint/a11y/useAriaPropsSupportedByRole: aria-label is needed for icon buttons
          <div
            role={isInteractive ? "button" : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            aria-label={
              typeof tooltipLabel === "string" ? tooltipLabel : undefined
            }
            aria-disabled={disabled && iconProps?.onClick ? true : undefined}
            onKeyDown={(e) => {
              if (disabled) return;
              if (iconProps?.onClick && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                iconProps.onClick?.(
                  e as unknown as React.MouseEvent<HTMLDivElement>,
                );
              }
            }}
            onClick={disabled ? undefined : iconProps?.onClick}
            {...(disabled && iconProps
              ? (() => {
                  const { onClick: _onClick, ...rest } = iconProps;
                  return rest;
                })()
              : iconProps)}
            className={iconClasses({
              className: cn(
                iconProps?.className,
                position === "leading"
                  ? classNames?.leadingIcon
                  : classNames?.trailingIcon,
                !tooltipLabel && wrapperClassName,
              ),
            })}
          >
            {IconContent}
          </div>
        );

        if (tooltipLabel) {
          return (
            <TooltipProvider
              primaryContent={tooltipLabel}
              tooltipProps={{ sideOffset: 0 }}
              className={cn(
                position === "leading"
                  ? leadingIconWrapperClasses()
                  : trailingIconWrapperClasses(),
                position === "leading"
                  ? classNames?.leadingIconWrapper
                  : classNames?.trailingIconWrapper,
                wrapperClassName,
              )}
            >
              {iconElement}
            </TooltipProvider>
          );
        }

        return iconElement;
      },
      [
        leadingIcon,
        trailingIcon,
        leadingIconProps,
        trailingIconProps,
        leadingIconClasses,
        trailingIconClasses,
        leadingIconWrapperClasses,
        trailingIconWrapperClasses,
        classNames?.leadingIcon,
        classNames?.trailingIcon,
        classNames?.leadingIconWrapper,
        classNames?.trailingIconWrapper,
        disabled,
      ],
    );

    const triggerContent = (
      <div
        ref={triggerWrapper ? ref : undefined}
        className={inputContainerClasses({
          className: cn(classNames?.inputContainer),
        })}
        {...inputContainerProps}
      >
        {leadingIcon &&
          renderIcon(
            "leading",
            cn(leadingIconWrapperClasses(), classNames?.leadingIconWrapper),
          )}

        <div
          className={inputWrapperClasses({
            className: classNames?.inputWrapper,
          })}
        >
          {prepend && <div className="contents">{prepend}</div>}
          {children}
          {append && <div className="contents">{append}</div>}
        </div>

        {!labelOutside && label && (
          <label
            htmlFor={inputId}
            onClick={onLabelClick}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onLabelClick?.();
              }
            }}
            className={labelClasses({
              className: classNames?.label,
            })}
            title={label}
          >
            <span>{label}</span>
          </label>
        )}

        {trailingSlot}

        {trailingIcon &&
          renderIcon(
            "trailing",
            cn(trailingIconWrapperClasses(), classNames?.trailingIconWrapper),
          )}
      </div>
    );

    return (
      <div
        ref={triggerWrapper ? undefined : ref}
        className={containerClasses({
          className: cn(classNames?.container, className),
        })}
        style={
          {
            "--scaled": shouldFloat ? (size === "xl" ? 0.875 : 0.75) : 1,
            ...style,
          } as React.CSSProperties
        }
        {...rest}
      >
        {labelOutside && label && (
          <label
            htmlFor={inputId}
            className={labelClasses({ className: classNames?.label })}
            title={label}
          >
            {label}
          </label>
        )}

        {triggerWrapper ? triggerWrapper(triggerContent) : triggerContent}

        {(helperBlock != null || descriptionText) &&
          (helperBlock ?? (
            <p
              id={inputId ? `${inputId}-description` : undefined}
              className={helperTextClasses({
                className: classNames?.helperText,
              })}
            >
              {(typeof error === "string" ? error : null) ??
                (typeof success === "string" ? success : null) ??
                (typeof helper === "string" ? helper : null) ??
                ""}
            </p>
          ))}
      </div>
    );
  },
);

InputTriggerWrapper.displayName = "InputTriggerWrapper";

export default InputTriggerWrapper;
