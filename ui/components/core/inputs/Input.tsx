/** biome-ignore-all lint/nursery/noSecrets: what biome thinks are secrets are just complex arbitrary tw classes */
"use client";

import { MaskInput, type MaskInputOptions, type MaskOptions } from "maska";
import * as React from "react";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getTextWidth } from "@shared/utils/uiHelpers";
import Button from "../button/Button";
import Shake from "../../atoms/shake/Shake";
import { useFontStyles } from "../../../hooks/useFontStyles";
import { cn } from "../../../util/classNameConstructor";
import type { IconName } from "../icon/names";
import type { TooltipProviderProps } from "../tooltip/TooltipProvider";
import CharacterCounter from "./CharacterCounter";
import InputTriggerWrapper from "./InputTriggerWrapper";
import { inputVariants } from "./inputVariants";

/**
 * Automatically resizes a textarea between minRows and maxRows.
 * Uses computed line-height and respects box-sizing.
 */
export function autoResizeTextarea(
  textarea: HTMLTextAreaElement,
  options: {
    minRows?: number;
    maxRows?: number;
  } = {},
): void {
  if (!textarea) return;

  const computedStyle = window.getComputedStyle(textarea);
  const borderBox = computedStyle.boxSizing === "border-box";
  const lineHeight = Number.parseFloat(computedStyle.lineHeight);

  if (!lineHeight || Number.isNaN(lineHeight)) return;

  const paddingOffset = borderBox
    ? Number.parseFloat(computedStyle.borderTopWidth || "0") +
      Number.parseFloat(computedStyle.borderBottomWidth || "0") +
      Number.parseFloat(computedStyle.paddingTop || "0") +
      Number.parseFloat(computedStyle.paddingBottom || "0")
    : 0;

  const minRows =
    options.minRows ??
    Number.parseInt(textarea.getAttribute("rows") || "1", 10);
  const maxRows = options.maxRows;

  const minHeight = Number(minRows) * lineHeight + paddingOffset;
  const maxHeight = maxRows
    ? Number(maxRows) * lineHeight + paddingOffset
    : Number.POSITIVE_INFINITY;

  textarea.style.height = "auto"; // Reset to shrink if needed
  const contentHeight = textarea.scrollHeight;

  const newHeight = Math.min(Math.max(contentHeight, minHeight), maxHeight);
  textarea.style.height = `${newHeight}px`;
  textarea.style.minHeight = `${0}px`;
}

// Generic interface that supports both string and number values
interface BaseInputProps {
  value: string | undefined;
  onChange?: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  label?: string;
  helper?: string | boolean;
  error?: string | boolean;
  success?: string | boolean;
  leadingIcon?: IconName | React.ReactNode;
  leadingIconProps?: React.HTMLAttributes<HTMLDivElement> & {
    label?: TooltipProviderProps["primaryContent"];
    onClick?: TooltipProviderProps["onClick"];
  };
  trailingIcon?: IconName | React.ReactNode;
  trailingIconProps?: React.HTMLAttributes<HTMLDivElement> & {
    label?: TooltipProviderProps["primaryContent"];
    onClick?: TooltipProviderProps["onClick"];
  };
  size?: "md" | "lg" | "xl";
  labelOutside?: boolean;
  silent?: boolean;
  validate?: boolean | ((value: string | undefined) => Promise<boolean>);
  prepend?: React.ReactNode;
  append?: React.ReactNode;
  classNames?: {
    input?: string;
    label?: string;
    container?: string;
    inputContainer?: string;
    inputWrapper?: string;
    leadingIcon?: string;
    leadingIconWrapper?: string;
    trailingIcon?: string;
    trailingIconWrapper?: string;
  };
  rich?: never;
  rows?: never;
  maxRows?: never;
  mask?: MaskOptions["mask"];
  maskOptions?: MaskInputOptions;
  characterCounter?: boolean;
  /** When provided (e.g. by Combobox), only the input container is wrapped so helper/error stay outside the trigger. */
  triggerWrapper?: (triggerElement: React.ReactElement) => React.ReactNode;
}

export interface StringInputProps
  extends BaseInputProps,
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      "type" | "size" | "value" | "onChange"
    > {
  type: "email" | "password" | "search" | "tel" | "text" | "url" | undefined;
}

// Number input props
export interface NumberInputProps
  extends BaseInputProps,
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      "size" | "value" | "onChange"
    > {
  type: "number";
  stepper?: boolean;
  characterCounter?: never;
}

export interface TextareaProps
  extends Omit<BaseInputProps, "rich" | "rows" | "maxRows">,
    Omit<
      React.TextareaHTMLAttributes<HTMLTextAreaElement>,
      "type" | "size" | "value" | "onChange"
    > {
  type: "textarea";
  rich?: boolean;
  rows?: number;
  maxRows?: number | string;
  richTextEditorProps?: {
    className?: string;
    aiResponseLang?: string;
    minimalToolbar?: boolean;
    /** @deprecated Use `minimalToolbar` */
    disableToolbarLists?: boolean;
  };
}

export type InputProps = (
  | (Omit<StringInputProps, "type"> & { type?: StringInputProps["type"] })
  | NumberInputProps
  | TextareaProps
) & {
  onClick?: React.MouseEventHandler<HTMLElement>;
};

// Extract common input props to reduce redundancy
type CommonInputElementProps = Omit<InputProps, "onChange"> & {
  ref: React.Ref<HTMLInputElement | HTMLTextAreaElement>;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onFocus: (
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onBlur: (
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  shouldFloat?: boolean;
  hasLabel?: boolean;
  hasOutsideLabel?: boolean;
};

// React component that renders the appropriate input element based on props
interface InputElementProps {
  isTextarea: boolean;
  rich: boolean;
  commonProps: CommonInputElementProps;
  textareaProps?: {
    rows: number;
    textareaSpecificProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  };
  richTextEditorProps?: {
    className?: string;
    aiResponseLang?: string;
    minimalToolbar?: boolean;
    /** @deprecated Use `minimalToolbar` */
    disableToolbarLists?: boolean;
  };
  inputProps?: {
    effectiveInputType: string;
    inputMode?:
      | "search"
      | "email"
      | "tel"
      | "text"
      | "url"
      | "none"
      | "numeric"
      | "decimal";
    pattern?: string;
    style?: React.CSSProperties;
    inputSpecificProps: React.InputHTMLAttributes<HTMLInputElement>;
  };
  inputClasses: ReturnType<typeof inputVariants>["input"];
}

const useRtfHeight = (rows = 3) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  const [contentEditablePadding, setContentEditablePadding] =
    useState<number>(0);

  useEffect(() => {
    if (!wrapperRef.current) return;
    ref.current = wrapperRef.current.querySelector("[contenteditable]");
    if (!ref.current) return;
    const { paddingTop, paddingBottom } = window.getComputedStyle(ref.current);
    setContentEditablePadding(
      Number.parseInt(paddingTop, 10) + Number.parseInt(paddingBottom, 10),
    );
  }, []);

  const [{ lineHeight }] = useFontStyles(
    ref as React.RefObject<HTMLDivElement>,
    [contentEditablePadding],
  );
  return [rows * lineHeight + contentEditablePadding, wrapperRef] as const;
};

const useMaskaInput = ({
  isTextarea,
  inputRef,
  mask,
  maskOptions,
  onMaskedValueChange,
}: {
  isTextarea: boolean;
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  mask?: MaskOptions["mask"];
  maskOptions?: MaskInputOptions;
  onMaskedValueChange?: (maskedValue: string) => void;
}) => {
  const maskDriver = React.useRef<MaskInput | null>(null);

  const onMaskedValueChangeRef = React.useRef(onMaskedValueChange);
  onMaskedValueChangeRef.current = onMaskedValueChange;
  const onMaskaRef = React.useRef(maskOptions?.onMaska);
  onMaskaRef.current = maskOptions?.onMaska;

  const stableMaskConfig = React.useMemo(() => {
    const { onMaska: _onMaska, ...rest } = maskOptions ?? {};
    return rest;
  }, [maskOptions]);

  const mergedMaskOptions = React.useMemo<MaskInputOptions | undefined>(() => {
    const effectiveMask = stableMaskConfig?.mask ?? mask;
    if (!effectiveMask) return undefined;

    return {
      ...stableMaskConfig,
      mask: effectiveMask,
      onMaska: (detail) => {
        const onMaskaOpt = onMaskaRef.current;
        if (Array.isArray(onMaskaOpt)) {
          for (const callback of onMaskaOpt) callback(detail);
        } else {
          onMaskaOpt?.(detail);
        }
        onMaskedValueChangeRef.current?.(detail.masked);
      },
    };
  }, [mask, stableMaskConfig]);

  React.useEffect(() => {
    const input =
      inputRef.current instanceof HTMLInputElement ? inputRef.current : null;

    if (isTextarea || !input || !mergedMaskOptions) {
      maskDriver.current?.destroy();
      maskDriver.current = null;
      return;
    }

    if (!maskDriver.current) {
      maskDriver.current = new MaskInput(input, mergedMaskOptions);
    } else {
      maskDriver.current.update(mergedMaskOptions);
    }
    maskDriver.current.updateValue(input);

    return () => {
      maskDriver.current?.destroy();
      maskDriver.current = null;
    };
  }, [isTextarea, inputRef, mergedMaskOptions]);
};

// @todo: maybe implement addEventListener("programmaticFocus")

const InputElement = React.memo<InputElementProps>(
  ({
    isTextarea,
    rich,
    commonProps,
    textareaProps,
    richTextEditorProps,
    inputProps,
    inputClasses,
  }) => {
    const [rtfHeight, ref] = useRtfHeight(textareaProps?.rows);

    if (isTextarea && textareaProps) {
      return (
        <textarea
          ref={commonProps.ref as React.Ref<HTMLTextAreaElement>}
          id={commonProps.id}
          value={commonProps.value}
          onChange={commonProps.onChange}
          onFocus={commonProps.onFocus}
          onBlur={commonProps.onBlur}
          disabled={commonProps.disabled}
          required={commonProps.required}
          placeholder={commonProps.placeholder}
          className={inputClasses({
            className: cn(
              "w-full",
              commonProps.className,
              commonProps.classNames?.input,
            ),
          })}
          aria-describedby={commonProps["aria-describedby"]}
          aria-invalid={commonProps["aria-invalid"]}
          aria-required={commonProps["aria-required"]}
          maxLength={commonProps.maxLength}
          minLength={commonProps.minLength}
          rows={textareaProps.rows}
          {...textareaProps.textareaSpecificProps}
        />
      );
    }

    // Input path
    if (inputProps) {
      return (
        <input
          ref={commonProps.ref as React.Ref<HTMLInputElement>}
          id={commonProps.id}
          type={inputProps.effectiveInputType}
          inputMode={inputProps.inputMode}
          pattern={inputProps.pattern}
          value={commonProps.value}
          onChange={commonProps.onChange}
          onFocus={commonProps.onFocus}
          onBlur={commonProps.onBlur}
          disabled={commonProps.disabled}
          required={commonProps.required}
          placeholder={commonProps.placeholder}
          className={inputClasses({
            className: cn(commonProps.className, commonProps.classNames?.input),
          })}
          aria-describedby={commonProps["aria-describedby"]}
          aria-invalid={commonProps["aria-invalid"]}
          aria-required={commonProps["aria-required"]}
          style={inputProps.style}
          {...inputProps.inputSpecificProps}
        />
      );
    }

    return null;
  },
);

export const Input = React.memo(
  forwardRef<
    Omit<HTMLInputElement | HTMLTextAreaElement, "size" | "onClick">,
    InputProps
  >(
    (
      {
        label,
        helper,
        error,
        success,
        leadingIcon,
        leadingIconProps,
        trailingIcon,
        trailingIconProps,
        className,
        classNames,
        value,
        onChange,
        onFocus,
        onBlur,
        onClick,
        disabled,
        required,
        silent,
        type = "text",
        id,
        placeholder,
        minLength,
        maxLength,
        size = "lg",
        labelOutside,
        validate,
        prepend,
        append,
        triggerWrapper,
        mask,
        maskOptions,
        maxRows: _maxRows,
        stepper: stepperProp,
        ...props
      },
      ref,
    ) => {
      const { t } = useTranslation();
      const internalInputRef = React.useRef<
        HTMLInputElement | HTMLTextAreaElement
      >(null);
      const inputId = React.useId();
      const [isFocused, setIsFocused] = React.useState(false);
      const checkValue = React.useCallback((val: string | undefined) => {
        if (val == null) return false;
        if (typeof val === "string") return val.length > 0;
        return true;
      }, []);
      const [hasValue, setHasValue] = React.useState(checkValue(value));
      const [showPassword, setShowPassword] = React.useState(false);
      const [triggerErrorShake, setTriggerErrorShake] = React.useState(false);

      const isTextarea = type === "textarea";
      const isNumberType = type === "number";

      const rich = isTextarea && "rich" in props && props.rich;
      const min =
        isNumberType && "min" in props && props.min !== undefined
          ? Number(props.min)
          : undefined;
      const max =
        isNumberType && "max" in props && props.max !== undefined
          ? Number(props.max)
          : undefined;
      const step =
        isNumberType && "step" in props && props.step !== undefined
          ? Number(props.step)
          : 1;
      const rows =
        isTextarea && "rows" in props && props.rows !== undefined
          ? Number(props.rows)
          : 3;
      const maxRows =
        (isTextarea && (_maxRows !== undefined ? Number(_maxRows) : 10)) || 1;

      const stepper =
        isNumberType && (stepperProp === undefined || stepperProp !== false);

      const characterCounter =
        !isNumberType &&
        (!("characterCounter" in props) || props.characterCounter !== false);

      useMaskaInput({
        isTextarea,
        inputRef: internalInputRef,
        mask,
        maskOptions,
        onMaskedValueChange: (maskedValue) => {
          if (validate !== undefined) {
            handleValidate(maskedValue).then(setIsValid);
          }
          setHasValue(checkValue(maskedValue));
          if (onChange && internalInputRef.current) {
            const syntheticEvent = {
              target: { ...internalInputRef.current, value: maskedValue },
              currentTarget: {
                ...internalInputRef.current,
                value: maskedValue,
              },
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(syntheticEvent);
          }
        },
      });

      React.useEffect(() => {
        setHasValue(checkValue(value));
      }, [value, checkValue]);

      // Memoize the focus handler to prevent recreating on every render
      const handleSetFocus = React.useCallback(
        (
          e:
            | React.MouseEvent<HTMLDivElement>
            | React.KeyboardEvent<HTMLDivElement>,
        ) => {
          // Don't focus if clicking on interactive elements
          const target = e.target as HTMLElement;
          const isInteractive =
            target.matches("button") ||
            target.matches('[role="button"]') ||
            target.matches("input") ||
            target.matches("textarea");

          if (!isInteractive && internalInputRef.current) {
            e.preventDefault();
            internalInputRef.current.focus();
            if (e.type === "dblclick") {
              internalInputRef.current.select();
            }
          }
        },
        [],
      );

      const handleFocus = React.useCallback(
        <T extends HTMLInputElement | HTMLTextAreaElement>(
          event: React.FocusEvent<T>,
        ) => {
          setIsFocused(true);
          (onFocus as React.FocusEventHandler<T>)?.(
            event as React.FocusEvent<T>,
          );
        },
        [onFocus],
      );

      const handleBlur = React.useCallback(
        <T extends HTMLInputElement | HTMLTextAreaElement>(
          event: React.FocusEvent<T>,
        ) => {
          setIsFocused(false);
          (onBlur as React.FocusEventHandler<T>)?.(
            event as React.FocusEvent<T>,
          );
          if (error) setTriggerErrorShake((e) => !e);
        },
        [onBlur, error],
      );

      const handleTextareaChange = React.useCallback(() => {
        if (
          isTextarea &&
          internalInputRef.current &&
          internalInputRef.current instanceof HTMLTextAreaElement
        ) {
          autoResizeTextarea(internalInputRef.current, {
            minRows: rows,
            maxRows,
          });
        }
      }, [rows, maxRows, isTextarea]);

      // biome-ignore lint/correctness/useExhaustiveDependencies: only run on mount
      React.useEffect(() => {
        handleTextareaChange();

        const resizeObserver = new ResizeObserver(handleTextareaChange);
        if (internalInputRef.current) {
          resizeObserver.observe(internalInputRef.current);
        }
        return () => {
          resizeObserver.disconnect();
        };
      }, [value]);

      const handleValidate = React.useCallback(
        async (val = value) => {
          const emailValidator = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

          // If validate is explicitly false, don't validate
          if (validate === false) {
            return null;
          }

          // If validate is a custom function, use it
          if (typeof validate === "function") {
            return await validate(val);
          }

          // Email validation
          if (type === "email") {
            if (!val || val.trim() === "") return null; // Don't validate empty emails
            return emailValidator.test(val);
          }

          // For other input types with validate=true, consider non-empty values as valid
          if (validate === true) {
            return Boolean(val && val.trim() !== "");
          }

          // Default: no validation
          return null;
        },
        [validate, type, value],
      );

      const [isValid, setIsValid] = React.useState<boolean | null>(null);

      // Run validation when value changes or component mounts
      React.useEffect(() => {
        if (validate !== undefined) {
          handleValidate().then(setIsValid);
        }
      }, [validate, handleValidate]);

      const handleChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          const raw = event.target.value;
          const isMaskedInput =
            !isTextarea && Boolean(maskOptions?.mask ?? mask);

          if (isMaskedInput) {
            // Maska's onMaska callback emits the post-processed value to onChange.
            setHasValue(checkValue(raw));
            if (validate !== undefined) {
              handleValidate(raw).then(setIsValid);
            }
            return;
          }

          // When type="number" and maxLength is set, browser ignores maxLength; use text input and enforce digits + length here
          const sanitized =
            isNumberType && maxLength != null
              ? raw.replace(/\D/g, "").slice(0, maxLength)
              : raw;
          const valueToUse =
            isNumberType && maxLength != null ? sanitized : raw;
          if (validate !== undefined) {
            handleValidate(valueToUse).then(setIsValid);
          }
          setHasValue(checkValue(valueToUse));
          if (sanitized !== raw) {
            const syntheticEvent = {
              ...event,
              target: { ...event.target, value: sanitized },
            } as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
            onChange?.(syntheticEvent);
          } else {
            onChange?.(event);
          }
        },
        [
          validate,
          handleValidate,
          onChange,
          checkValue,
          isTextarea,
          maskOptions,
          mask,
          isNumberType,
          maxLength,
        ],
      );

      // Memoize stepper handlers
      // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
      const handleStepUp = React.useCallback(() => {
        if (!isNumberType || disabled) return;

        const currentValue =
          typeof value === "number"
            ? value
            : Number.isNaN(Number(value))
              ? 0
              : Number(value);
        const stepValue =
          "step" in props && props.step ? Number(props.step) : 1;
        const maxValue =
          "max" in props && props.max !== undefined
            ? Number(props.max)
            : Number.MAX_SAFE_INTEGER;
        const newValue = Math.min(currentValue + stepValue, maxValue);

        // Create synthetic event for onChange
        if (onChange && internalInputRef.current) {
          const syntheticEvent = {
            target: { ...internalInputRef.current, value: newValue.toString() },
            currentTarget: {
              ...internalInputRef.current,
              value: newValue.toString(),
            },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(syntheticEvent);
        }
      }, [
        isNumberType,
        disabled,
        value,
        (props as unknown as NumberInputProps).step,
        (props as unknown as NumberInputProps).max,
        onChange,
      ]);

      // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
      const handleStepDown = React.useCallback(() => {
        if (!isNumberType || disabled) return;

        const currentValue =
          typeof value === "number"
            ? value
            : Number.isNaN(Number(value))
              ? 0
              : Number(value);
        const stepValue =
          "step" in props && props.step ? Number(props.step) : 1;
        const minValue =
          "min" in props && props.min !== undefined
            ? Number(props.min)
            : Number.MIN_SAFE_INTEGER;
        const newValue = Math.max(currentValue - stepValue, minValue);

        // Create synthetic event for onChange
        if (onChange && internalInputRef.current) {
          const syntheticEvent = {
            target: { ...internalInputRef.current, value: newValue.toString() },
            currentTarget: {
              ...internalInputRef.current,
              value: newValue.toString(),
            },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(syntheticEvent);
        }
      }, [
        isNumberType,
        disabled,
        value,
        (props as unknown as NumberInputProps).step,
        (props as unknown as NumberInputProps).min,
        onChange,
      ]);

      // Memoize computed values
      const shouldFloat = React.useMemo(
        () =>
          labelOutside
            ? false
            : Boolean(isFocused || hasValue || prepend || append),
        [labelOutside, isFocused, hasValue, prepend, append],
      );

      const hasError = React.useMemo(
        () =>
          Boolean(
            error ||
              (maxLength !== undefined && value && value.length > maxLength) ||
              (minLength !== undefined && value && value.length < minLength),
          ) || isValid === false,
        [error, maxLength, value, minLength, isValid],
      );

      React.useEffect(() => {
        if (error) setTriggerErrorShake((e) => !e);
      }, [error]);

      const hasSuccess = React.useMemo(() => {
        return (Boolean(success) || isValid === true) && !hasError;
      }, [success, isValid, hasError]);

      const descriptionText = React.useMemo(
        () =>
          (typeof error === "string" && error) ||
          (typeof success === "string" && success) ||
          (typeof helper === "string" && helper),
        [error, success, helper],
      );

      // Password toggle logic (not applicable for textarea or number)
      const isPasswordType =
        type === "password" && !isTextarea && !isNumberType;
      const isEmailType = type === "email" && !isTextarea && !isNumberType;
      // type="number" + maxLength: browser ignores maxLength; use "text" so maxLength works and we enforce digits in handleChange
      const numberWithMaxLength = isNumberType && maxLength != null;
      const effectiveInputType =
        (isPasswordType && showPassword) || numberWithMaxLength ? "text" : type;

      const actualLeadingIcon = leadingIcon;
      const { label: leadingTooltipLabel, ...restActualLeadingIconProps } =
        leadingIconProps || {};
      const actualLeadingTooltipLabel = leadingTooltipLabel;

      const actualLeadingIconProps = restActualLeadingIconProps;

      // Memoize trailing icon logic to prevent recalculation
      const trailingIconConfig = React.useMemo(() => {
        let actualTrailingIcon = trailingIcon;
        let actualOnTrailingIconClick = trailingIconProps?.onClick;
        const { label: trailingTooltipLabel, ...restActualTrailingIconProps } =
          trailingIconProps || {};
        let actualTrailingTooltipLabel = trailingTooltipLabel;

        const actualTrailingIconProps = restActualTrailingIconProps;

        if (isPasswordType) {
          actualTrailingIcon = showPassword ? "eye-strikethrough" : "eye";
          actualOnTrailingIconClick = () => setShowPassword(!showPassword);
          actualTrailingTooltipLabel = showPassword
            ? t("util:hide", { val: t("auth:password") })
            : t("util:show", { val: t("auth:password") });
          actualTrailingIconProps.tabIndex = -1;
        }

        if (isEmailType) {
          if (hasSuccess) actualTrailingIcon = "checkmark-circle-fill";
          actualTrailingIconProps.className = cn(
            "duration-500 ease-expressive-out",
            !trailingIcon && "opacity-0 scale-75",
            hasSuccess && "text-icon-success opacity-100 scale-100",
          );
        }

        return {
          actualTrailingIcon,
          actualOnTrailingIconClick,
          actualTrailingTooltipLabel,
          actualTrailingIconProps,
        };
      }, [
        trailingIcon,
        trailingIconProps,
        isPasswordType,
        showPassword,
        isEmailType,
        hasSuccess,
        t,
      ]);

      // Memoize inputVariants call
      const variantClasses = React.useMemo(
        () =>
          inputVariants({
            size,
            hasError,
            hasSuccess,
            hasLeadingIcon: Boolean(leadingIcon),
            hasTrailingIcon: Boolean(trailingIconConfig.actualTrailingIcon),
            hasStepper: stepper,
            isFloating: shouldFloat,
            hasLabel: !!label,
            isRich: Boolean(rich),
            type,
            trailingIconClickable: Boolean(
              trailingIconConfig.actualOnTrailingIconClick,
            ),
            labelOutside,
            silent,
          }),
        [
          size,
          hasError,
          hasSuccess,
          leadingIcon,
          trailingIconConfig.actualTrailingIcon,
          stepper,
          shouldFloat,
          label,
          rich,
          type,
          trailingIconConfig.actualOnTrailingIconClick,
          labelOutside,
          silent,
        ],
      );

      const {
        input: inputClasses,
        stepper: stepperClasses,
        stepperButton: stepperButtonClasses,
        stepperDivider: stepperDividerClasses,
        richTextEditor: richTextEditorClasses,
      } = variantClasses;

      const stepperSlot =
        isNumberType && stepper ? (
          <div className={stepperClasses()}>
            <Button
              type="button"
              variant="shapeless"
              className={stepperButtonClasses()}
              onClick={handleStepUp}
              disabled={disabled ?? (max !== undefined && Number(value) >= max)}
              disabledNotice={t("stepper.maxReached", {
                max,
              })}
              aria-label={t("stepper.increase")}
              tabIndex={-1}
              leadingIcon="arrowhead-up-md"
              leadingIconProps={{
                className: "h-5 w-5",
                "aria-hidden": true,
              }}
            />
            <div className={stepperDividerClasses()} />
            <Button
              type="button"
              variant="shapeless"
              className={stepperButtonClasses()}
              onClick={handleStepDown}
              disabled={disabled || (min !== undefined && Number(value) <= min)}
              disabledNotice={t("stepper.minReached", {
                min,
              })}
              aria-label={t("stepper.decrease")}
              tabIndex={-1}
              leadingIcon="arrowhead-down-md"
              leadingIconProps={{
                className: "h-5 w-5",
                "aria-hidden": true,
              }}
            />
          </div>
        ) : undefined;

      const helperBlock =
        characterCounter &&
        (descriptionText ||
          maxLength !== undefined ||
          minLength !== undefined) ? (
          <div className="flex justify-between">
            <Shake trigger={triggerErrorShake}>
              {descriptionText && (
                <p
                  id={`${inputId}-description`}
                  className={variantClasses.helperText()}
                >
                  {descriptionText}
                </p>
              )}
            </Shake>
            <CharacterCounter
              value={value ?? ""}
              minLength={minLength}
              maxLength={maxLength}
              inputRef={internalInputRef}
            />
          </div>
        ) : undefined;

      // Combined ref handler that works with both callback refs and ref objects
      const combinedRef = React.useCallback(
        (node: HTMLInputElement | HTMLTextAreaElement | null) => {
          // Set our internal ref
          (
            internalInputRef as React.MutableRefObject<
              HTMLInputElement | HTMLTextAreaElement | null
            >
          ).current = node;

          // Handle the forwarded ref
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        },
        [ref],
      );

      const _placeholderWidth = useMemo(() => {
        const fontSize = size === "md" ? "12px" : "16px";
        return getTextWidth(placeholder || "", `${fontSize} Nunito`);
      }, [placeholder, size]);

      return (
        <InputTriggerWrapper
          label={label}
          labelOutside={labelOutside}
          shouldFloat={shouldFloat}
          leadingIcon={actualLeadingIcon}
          leadingIconProps={
            actualLeadingTooltipLabel
              ? { ...actualLeadingIconProps, label: actualLeadingTooltipLabel }
              : actualLeadingIconProps
          }
          trailingIcon={trailingIconConfig.actualTrailingIcon}
          trailingIconProps={{
            ...trailingIconConfig.actualTrailingIconProps,
            label: trailingIconConfig.actualTrailingTooltipLabel,
            onClick: trailingIconConfig.actualOnTrailingIconClick,
          }}
          prepend={
            prepend ? (
              <div className={cn(className, "contents")}>{prepend}</div>
            ) : undefined
          }
          append={
            append ? (
              <div className={cn(className, "contents")}>{append}</div>
            ) : undefined
          }
          trailingSlot={stepperSlot}
          helper={helperBlock ? undefined : helper}
          error={helperBlock ? undefined : error}
          success={helperBlock ? undefined : success}
          size={size}
          disabled={disabled}
          hasError={hasError}
          hasSuccess={hasSuccess}
          inputId={id || inputId}
          onLabelClick={() => internalInputRef.current?.focus()}
          inputContainerProps={{
            onClick,
            onMouseDown: handleSetFocus,
            onDoubleClick: handleSetFocus,
            onKeyDown: (e) => {
              if (e.key === "Enter") {
                handleSetFocus(e);
              }
            },
          }}
          helperBlock={helperBlock}
          triggerWrapper={triggerWrapper}
          isRich={Boolean(rich)}
          type={type}
          silent={silent}
          classNames={classNames}
          style={
            {
              "--scaled": shouldFloat ? (size === "xl" ? 0.875 : 0.75) : 1,
              ...props.style,
            } as React.CSSProperties
          }
        >
          <InputElement
            isTextarea={isTextarea}
            rich={Boolean(rich)}
            inputClasses={inputClasses}
            commonProps={{
              ref: combinedRef,
              id: id || inputId,
              value,
              size,
              onChange: handleChange,
              onFocus: handleFocus,
              onBlur: handleBlur,
              disabled,
              required,
              placeholder:
                labelOutside || shouldFloat || !label ? placeholder || "" : "",
              shouldFloat,
              hasLabel: !!label,
              hasOutsideLabel: labelOutside,
              className,
              classNames,
              "aria-describedby": descriptionText
                ? `${inputId}-description`
                : undefined,
              "aria-invalid": hasError,
              "aria-required": required,
              maxLength,
              minLength,
            }}
            textareaProps={
              isTextarea
                ? {
                    rows,
                    textareaSpecificProps: (() => {
                      const cast = props as TextareaProps &
                        React.TextareaHTMLAttributes<HTMLTextAreaElement>;
                      const {
                        richTextEditorProps: _richTextEditorProps,
                        ...htmlProps
                      } = cast as TextareaProps & {
                        richTextEditorProps?: TextareaProps["richTextEditorProps"];
                      } & Record<string, unknown>;
                      return htmlProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>;
                    })(),
                  }
                : undefined
            }
            richTextEditorProps={
              rich
                ? {
                    ...(isTextarea && "richTextEditorProps" in props
                      ? (props as TextareaProps).richTextEditorProps
                      : {}),
                    className: cn(
                      richTextEditorClasses(),
                      isTextarea && "richTextEditorProps" in props
                        ? (props as TextareaProps).richTextEditorProps
                            ?.className
                        : undefined,
                    ),
                  }
                : undefined
            }
            inputProps={
              !isTextarea
                ? {
                    effectiveInputType,
                    inputMode: isNumberType
                      ? numberWithMaxLength
                        ? "numeric"
                        : "inputMode" in props && props.inputMode
                          ? props.inputMode
                          : "decimal"
                      : undefined,
                    pattern: isNumberType
                      ? "pattern" in props && props.pattern
                        ? props.pattern
                        : step % 1 === 0
                          ? "[0-9]*"
                          : undefined
                      : undefined,
                    style: {
                      width: !placeholder ? "0px" : undefined,
                    },
                    inputSpecificProps:
                      props as React.InputHTMLAttributes<HTMLInputElement>,
                  }
                : undefined
            }
          />
        </InputTriggerWrapper>
      );
    },
  ),
);

Input.displayName = "Input";
