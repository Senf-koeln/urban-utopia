import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { Root as Label } from "@radix-ui/react-label";
import type * as React from "react";
import { generateBase62Id } from "@shared";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "../../../util/classNameConstructor";
import Icon from "../icon/Icon";
import TooltipProvider from "../tooltip/TooltipProvider";
import { bodySm } from "../typography/Typography";

const CheckboxVariant = tv({
  slots: {
    wrapperStyle: `checkbox flex items-center gap-2 ${bodySm}`,
    checkboxWrapper: "flex h-6 w-6 items-center justify-center self-start",
    inputStyles: [
      "bg-surface-default text-border-default hover:text-border-highlight-default group-hover/menu-item:text-border-highlight-default focus-visible:outline-focused-black disabled:border-border-disabled aria-checked:text-border-highlight-default data-[state=indeterminate]:text-border-highlight-default box-border flex h-5 w-5 items-center justify-center overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 shadow-[inset_0_0_0_var(--size,2px)_currentColor]",
      "duration-500 transition-[box-shadow] ease-expressive-out",
    ],
    indicatorStyles:
      "text-icon-on-primary-depressed -m-2 flex items-center justify-center",
    labelStyles: "flex flex-col",
    helperStyles: "text-text-subdued",
  },
  variants: {
    type: {
      checkbox: {
        inputStyles:
          "aria-checked:duration-100 aria-checked:ease-in rounded-md aria-checked:[--size:10px] data-[state=indeterminate]:duration-100 data-[state=indeterminate]:ease-in data-[state=indeterminate]:[--size:10px]",
      },
      radio: {
        inputStyles: "scale-105 rounded-xl aria-checked:[--size:5px]",
      },
    },
    error: {
      true: {
        inputStyles:
          "text-border-critical-default aria-checked:bg-icon-critical data-[state=indeterminate]:bg-icon-critical",
      },
    },
    disabled: {
      true: {
        wrapperStyle: "pointer-events-none",
        inputStyles: "bg-surface-disabled text-border-disabled",
        labelStyles: "text-text-disabled",
        helperStyles: "text-current",
      },
    },
  },
});

interface CheckboxProps
  extends VariantProps<typeof CheckboxVariant>,
    Omit<RadixCheckbox.CheckboxProps, "asChild"> {
  label?: string | React.JSX.Element;
  helperText?: string | React.JSX.Element;
  indeterminate?: boolean;
  color?:
    | "red"
    | "rose"
    | "purple"
    | "blue"
    | "teal"
    | "green"
    | "yellow"
    | "orange"
    | "brown";
  type?: "checkbox" | "radio";
  dataCy?: string;
  disabledNotice?: string;
  noTooltip?: boolean;
  classNames?: {
    wrapper?: string;
    button?: string;
  };
}

const colors: Record<Required<CheckboxProps>["color"], string> = {
  red: "aria-checked:bg-palette-red-700 data-[state=indeterminate]:bg-palette-red-700 hover:border-palette-red-700",
  rose: "aria-checked:bg-palette-rose-700 data-[state=indeterminate]:bg-palette-rose-700 hover:border-palette-rose-700",
  purple:
    "aria-checked:bg-palette-purple-700 data-[state=indeterminate]:bg-palette-purple-700 hover:border-palette-purple-700",
  blue: "aria-checked:bg-palette-blue-700 data-[state=indeterminate]:bg-palette-blue-700 hover:border-palette-blue-700",
  teal: "aria-checked:bg-palette-teal-700 data-[state=indeterminate]:bg-palette-teal-700 hover:border-palette-teal-700",
  green:
    "aria-checked:bg-palette-green-700 data-[state=indeterminate]:bg-palette-green-700 hover:border-palette-green-700",
  yellow:
    "aria-checked:bg-palette-yellow-700 data-[state=indeterminate]:bg-palette-yellow-700 hover:border-palette-yellow-700",
  orange:
    "aria-checked:bg-palette-orange-700 data-[state=indeterminate]:bg-palette-orange-700 hover:border-palette-orange-700",
  brown:
    "aria-checked:bg-palette-brown-700 data-[state=indeterminate]:bg-palette-brown-700 hover:border-palette-brown-700",
};
const Checkbox = ({
  label,
  helperText,
  error,
  disabled,
  disabledNotice,
  required,
  onCheckedChange,
  checked,
  indeterminate,
  color,
  className,
  classNames,
  dataCy,
  noTooltip,
  type = "checkbox",
  ...props
}: CheckboxProps) => {
  const {
    wrapperStyle,
    checkboxWrapper,
    inputStyles,
    indicatorStyles,
    labelStyles,
    helperStyles,
  } = CheckboxVariant({
    error,
    disabled,
    type,
  });
  const id = generateBase62Id();

  /** Match Radix: undefined `checked` means uncontrolled — Indicators use Presence there. */
  const isControlled = checked !== undefined;
  const isIndeterminateUi =
    checked === "indeterminate" ||
    (indeterminate === true && checked !== true);

  const Item = (
    <div className={cn(wrapperStyle({ className }))}>
      <div className={checkboxWrapper()}>
        <RadixCheckbox.Root
          {...props}
          onCheckedChange={onCheckedChange}
          checked={checked}
          id={id}
          required={required}
          disabled={disabled}
          className={cn(
            inputStyles({
              class: !error && !disabled && color ? colors[color] : "",
            }),
            classNames?.button,
          )}
          data-cy={dataCy}
        >
          {type === "checkbox" ? (
            isControlled ? (
              (checked === true || checked === "indeterminate") && (
                <span
                  className={cn(indicatorStyles())}
                  style={{ pointerEvents: "none" }}
                >
                  <Icon
                    name={isIndeterminateUi ? "minus-sm" : "checkmark-md"}
                  />
                </span>
              )
            ) : (
              <RadixCheckbox.Indicator className={cn(indicatorStyles())}>
                <Icon
                  name={isIndeterminateUi ? "minus-sm" : "checkmark-md"}
                />
              </RadixCheckbox.Indicator>
            )
          ) : null}
        </RadixCheckbox.Root>
      </div>
      {(!!label || !!helperText) && (
        <Label
          htmlFor={id}
          className={labelStyles({ class: helperText ? "mt-[3px]" : "" })}
        >
          {label}
          {helperText && (
            <span className={cn(helperStyles())}>{helperText}</span>
          )}
        </Label>
      )}
    </div>
  );

  return (
    <TooltipProvider
      critical={true}
      disabled={disabled}
      primaryContent={disabledNotice}
      noTooltip={noTooltip || !disabled}
      className={classNames?.wrapper}
    >
      {Item}
    </TooltipProvider>
  );
};
Checkbox.displayName = "Checkbox";
export default Checkbox;
