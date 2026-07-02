import { Content, Portal, Root, Trigger } from "@radix-ui/react-popover";
import { animated, useTransition } from "@react-spring/web";
import type * as React from "react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { springConfig } from "@shared/index";
import { tv } from "tailwind-variants";
import { Icon } from "../../..";
import { useIsMobile } from "../../../hooks/customDeviceDetect";
import { cn } from "../../../util/classNameConstructor";
import { resolveOverlayZIndex } from "../../../util/overlayZIndex";
import { Z_INDEX } from "../../../util/zIndexLayers";
import type { TagProps } from "../../atoms/tag/Tag";
import Button from "../../core/button/Button";
import ListItem from "../../core/list/ListItem";
import Seperator from "../../core/seperator/Seperator";
import ModalButton from "../../molecules/modalStack/ModalButton";
import { useModals } from "../../molecules/modalStack/ModalProvider";
import type { IconName } from "../icon/names";
import {
  Input,
  type InputProps,
  type StringInputProps,
  type TextareaProps,
} from "./Input";
import SelectedOptionsTags from "./SelectedOptionsTags";

type ComboboxOptionBase<T = string, D = unknown> = {
  value: T;
  label: string;
  subLabel?: string;
  disabled?: boolean;
  leadingIcon?: IconName | React.JSX.Element;
  leadingIconProps?: React.HTMLAttributes<HTMLDivElement> & { label?: string };
  trailingIcon?: IconName | React.JSX.Element;
  trailingIconProps?: React.HTMLAttributes<HTMLDivElement> & { label?: string };
  rightSlot?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  data?: D;
  color?: TagProps["color"];
};
export type ComboboxOption<T = string, D = unknown> =
  | ComboboxOptionBase<T, D>
  | (Partial<ComboboxOptionBase<T, D>> & {
      divider?: boolean;
    });

// Type guard functions with proper null safety
const isDividerOption = (
  option?: ComboboxOption | null,
): option is { divider: boolean } => {
  return Boolean(option && typeof option === "object" && "divider" in option);
};

const isRegularOption = (
  option?: ComboboxOption | null,
): option is ComboboxOptionBase => {
  return Boolean(
    option && typeof option === "object" && !isDividerOption(option),
  );
};

// Helper to safely get label from selected option
const getOptionLabel = (option?: ComboboxOption | null): string => {
  return isRegularOption(option) ? option.label : "";
};

// Helper to check if option is selectable (not divider and not disabled)
const isSelectableOption = (option?: ComboboxOption | null): boolean => {
  return isRegularOption(option) && !option.disabled;
};

/** Allowed input types for Combobox (excludes textarea, password). Use e.g. "number" for numeric keypad on mobile. */
export type ComboboxInputType =
  | "text"
  | "search"
  | "email"
  | "tel"
  | "url"
  | "number";

export type ComboboxProps = Omit<
  StringInputProps,
  | "value"
  | "onChange"
  | "type"
  | "step"
  | "min"
  | "max"
  | "inputMode"
  | "pattern"
  | "multiple"
> & {
  options: ComboboxOption[];
  /** Input type passed to the underlying input (e.g. "number" for numeric keypad on mobile). Textarea and password are not allowed. */
  type?: ComboboxInputType;
  onValueChange?: (value: string) => void;
  emptyMessage?: string;
  loading?: boolean;
  dropdownRef?: React.RefObject<HTMLDivElement>;
  /** Optional z-index override for the dropdown portal content. */
  dropdownZIndex?: number;
  ref?: React.RefObject<HTMLInputElement | null>;
  open?: boolean;
  onOpenChange?: React.Dispatch<React.SetStateAction<boolean>>;
  enableSearch?: boolean;
  /** Allows values not present in options (common "freeSolo" behavior). */
  freeSolo?: boolean;
  classNames?: {
    optionLeadingIcon?: string;
    optionLabel?: string;
    option?: string;
  };
  asModal?: boolean;
  /** Slot for custom footer content (rendered before cancel/done when multiple). Footer shows when footerSlot or multiple. */
  footerSlot?: React.ReactNode;
} & (
    | {
        multiple: "tag" | "plain" | true;
        value?: string[] | null;
        onChange?: (option: ComboboxOption[]) => void;
      }
    | {
        multiple?: false;
        value?: string | null;
        onChange?: (option: ComboboxOption) => void;
      }
  ) & { type?: "number"; stepper?: boolean };

const popoverContentVariants = tv({
  base: "bg-surface-default w-[var(--radix-popover-trigger-width)] rounded-xl border shadow-lg outline-none",
  defaultVariants: {
    isEmpty: false,
  },
});

const optionVariants = tv({
  base: "group/option relative flex items-center w-full gap-2 cursor-default select-none px-2 py-3 min-h-11 text-base outline-none transition-colors rounded-lg scroll-my-1",
  variants: {
    disabled: {
      true: "pointer-events-none opacity-50",
      false:
        "cursor-pointer no-touch:hover:bg-action-secondary-hovered touch-any:active:bg-action-secondary-pressed",
    },
    highlighted: {
      true: "bg-action-secondary-hovered group-hover/listbox:hover:action-secondary-pressed",
      false: "",
    },
    selected: {
      true: "bg-surface-highlight-subdued",
      false: "",
    },
    divider: {
      true: "pointer-events-none py-0 px-0 min-h-0 justify-center",
      false: "",
    },
  },
  compoundVariants: [
    {
      selected: true,
      highlighted: true,
      class: "bg-action-secondary-hovered",
    },
  ],
  defaultVariants: {
    disabled: false,
    highlighted: false,
    selected: false,
    divider: false,
  },
});

const renderOption = ({
  option,
  index,
  selected,
  highlightedIndex,
  classNames,
}: {
  option: ComboboxOption;
  index: number;
  selected: ComboboxOption[];
  highlightedIndex: number;
  classNames: ComboboxProps["classNames"];
}) => {
  if (isDividerOption(option)) {
    return <hr className="w-full border-t border-border-subdued my-1 mx-2" />;
  }

  if (!isRegularOption(option)) return null;

  const isHighlighted = highlightedIndex === index;
  const isSelected = selected.some(
    (item) => isRegularOption(item) && item.value === option.value,
  );

  const rightSlot = option.rightSlot;

  return (
    <>
      {option.leadingIcon &&
        (typeof option.leadingIcon === "string" ? (
          <Icon
            name={option.leadingIcon}
            className={cn(
              "h-[1.125em] w-5 shrink-0 text-icon-default group-hover/option:text-[var(--primary-800)]",
              (isHighlighted || isSelected) && "text-[var(--primary-800)]",
              classNames?.optionLeadingIcon,
            )}
            aria-hidden="true"
          />
        ) : (
          <span
            className={cn(
              "h-5 w-5 shrink-0 text-icon-default group-hover/option:text-[var(--primary-800)]",
              (isHighlighted || isSelected) && "text-[var(--primary-800)]",
              classNames?.optionLeadingIcon,
            )}
          >
            {option.leadingIcon}
          </span>
        ))}
      <div className="flex flex-col">
        <span
          className={cn(
            option.subLabel && "line-clamp-1",
            classNames?.optionLabel,
          )}
        >
          {option.label ?? option.value}
        </span>
        {option.subLabel && (
          <span
            className={cn(
              "line-clamp-1 text-sm text-text-subdued group-hover/option:text-[var(--primary-800)]",
              (isHighlighted || isSelected) && "text-[var(--primary-800)]",
            )}
          >
            {option.subLabel}
          </span>
        )}
      </div>
      {rightSlot ? (
        <div className="ms-auto flex items-center gap-2">
          <div className="text-text-subdued">{rightSlot}</div>
          {isSelected && (
            <Icon name="checkmark-md" className="h-5 w-5" aria-hidden="true" />
          )}
        </div>
      ) : (
        isSelected && (
          <Icon
            name="checkmark-md"
            className="shrink-0 ms-auto h-5 w-5"
            aria-hidden="true"
          />
        )
      )}
    </>
  );
};

const Option = ({
  option,
  index,
  selected,
  listboxId,
  highlightedIndex,
  handleOptionSelect,
  classNames,
}: {
  option: ComboboxOption;
  index: number;
  selected: ComboboxOption[];
  listboxId: string;
  highlightedIndex: number;
  handleOptionSelect: (option: ComboboxOption) => void;
  classNames: ComboboxProps["classNames"];
}) => {
  const isSelected = selected.some(
    (item) =>
      isRegularOption(item) &&
      isRegularOption(option) &&
      item.value === option.value,
  );
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: this is a custom combobox implementation
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: this is a custom combobox implementation
    <div
      key={Object.values(option).join("-")}
      role={isDividerOption(option) ? "separator" : "option"}
      id={`${listboxId}-option-${index}`}
      className={cn(
        optionVariants({
          disabled: isRegularOption(option) ? option.disabled : false,
          highlighted: !isDividerOption(option) && highlightedIndex === index,
          selected: !isDividerOption(option) && isSelected,
          divider: isDividerOption(option),
        }),
        classNames?.option,
      )}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        if (isSelectableOption(option) && isRegularOption(option)) {
          option.onClick?.(e);
          if (!option.onClick || !e.defaultPrevented) {
            handleOptionSelect(option);
          }
        }
      }}
      onKeyDown={(e) => {
        if (
          (e.key === "Enter" || e.key === " ") &&
          isSelectableOption(option)
        ) {
          e.preventDefault();
          handleOptionSelect(option);
        }
      }}
      aria-selected={isSelected}
      aria-disabled={!isSelectableOption(option)}
      tabIndex={-1}
    >
      {renderOption({ option, index, selected, highlightedIndex, classNames })}
    </div>
  );
};

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  value = "",
  onChange,
  onValueChange,
  onBlur,
  loading = false,
  emptyMessage = "No options found.",
  dropdownRef,
  dropdownZIndex,
  ref,
  open: openProp = false,
  onOpenChange,
  leadingIcon,
  trailingIcon: trailingIconProp,
  trailingIconProps: trailingIconPropsProp,
  multiple = false,
  freeSolo = false,
  enableSearch = true,
  classNames,
  placeholder,
  asModal = false,
  footerSlot,
  type: typeProp,
  stepper: stepperProp,
  ...props
}) => {
  const inputType = typeProp ?? "text";
  const numberStepper = stepperProp ?? false;
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { closeModal } = useModals();
  const [open, setOpen] = useState(openProp);
  const [wasOpen, setWasOpen] = useState<boolean | null>(null);
  const [openTop, setOpenTop] = useState(false);
  // Tracks actual focus (mouse or keyboard). We intentionally don't use :focus-visible here,
  // because we also show UI (clear icon) on mouse focus.
  const [isFocused, setIsFocused] = useState(false);
  const [pendingBlurCheck, setPendingBlurCheck] = useState(false);
  const justSelected = useRef(false);
  const onSingleChange = onChange as
    | ((option: ComboboxOption) => void)
    | undefined;

  // Helper function to get selected options from value
  const getSelectedOptions = useCallback(
    (val: string | string[] | null | undefined): ComboboxOption[] => {
      if (!val) return [];

      const findOption = (searchValue: string) =>
        options.find(
          (opt) =>
            isRegularOption(opt) &&
            (opt.value === searchValue || opt.label === searchValue),
        );

      if (multiple && Array.isArray(val)) {
        return val.map(findOption).filter(Boolean) as ComboboxOption[];
      }

      const str = val.toString();
      const currentValue = findOption(str);
      if (currentValue) return [currentValue];
      if (freeSolo && str.trim() !== "") {
        return [{ value: str, label: str }];
      }
      return [];
    },
    [options, multiple, freeSolo],
  );

  // Selected state and input value
  const [selected, setSelected] = useState<ComboboxOption[]>(() =>
    getSelectedOptions(value),
  );

  const [inputValue, setInputValue] = useState(() => {
    if (multiple) return "";
    return (
      getOptionLabel(getSelectedOptions(value)[0]) || value?.toString() || ""
    );
  });

  // Navigation helpers with simplified, more reliable logic
  const navigationHelpers = useMemo(() => {
    const findNext = (fromIndex: number): number => {
      // Search forward from fromIndex+1 to end (skip current index)
      for (let i = fromIndex + 1; i < options.length; i++) {
        if (isSelectableOption(options[i])) return i;
      }
      // Wrap around: search from start to fromIndex
      for (let i = 0; i <= fromIndex; i++) {
        if (isSelectableOption(options[i])) return i;
      }
      return -1;
    };

    const findPrev = (fromIndex: number): number => {
      // Search backward from fromIndex-1 to start (skip current index)
      for (let i = fromIndex - 1; i >= 0; i--) {
        if (isSelectableOption(options[i])) return i;
      }
      // Wrap around: search from end to fromIndex
      for (let i = options.length - 1; i >= fromIndex; i--) {
        if (isSelectableOption(options[i])) return i;
      }
      return -1;
    };

    const findFirst = (): number => {
      return options.findIndex(isSelectableOption);
    };

    const findLast = (): number => {
      for (let i = options.length - 1; i >= 0; i--) {
        if (isSelectableOption(options[i])) return i;
      }
      return -1;
    };

    return { findNext, findPrev, findFirst, findLast };
  }, [options]);

  const matchingIndex = useMemo(
    () =>
      options.findIndex(
        (option) =>
          isRegularOption(option) &&
          option.label === inputValue &&
          !option.disabled,
      ),
    [options, inputValue],
  );

  const [highlightedIndex, setHighlightedIndex] = useState(() => {
    return matchingIndex > -1 ? matchingIndex : navigationHelpers.findFirst();
  });

  const inputRefFallback = useRef<HTMLInputElement>(null);
  const inputRef = ref || inputRefFallback;
  const listRef = useRef<HTMLDivElement>(null);
  const comboboxId = useId();
  const listboxId = `${comboboxId}-listbox`;

  // Default cursor when dropdown is open (like Select), except over clickable items in the dropdown
  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.cursor;
    document.body.style.cursor = "default";
    return () => {
      document.body.style.cursor = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !inputRef || !("current" in inputRef) || !inputRef.current) {
      return;
    }

    const updateSide = () => {
      if (!inputRef.current) return;
      const rect = inputRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const threshold = isMobile ? 150 : 200;
      setOpenTop(spaceBelow < threshold);
    };

    updateSide();
    window.addEventListener("resize", updateSide);
    window.addEventListener("scroll", updateSide, true);

    return () => {
      window.removeEventListener("resize", updateSide);
      window.removeEventListener("scroll", updateSide, true);
    };
  }, [open, inputRef, isMobile]);

  // Consolidated blur/input validation logic
  const validateInput = useCallback(
    (deferIfLoading = false) => {
      if (loading && deferIfLoading) {
        setPendingBlurCheck(true);
        return;
      }

      if (multiple) {
        setInputValue("");
        onValueChange?.("");
        return;
      }

      // User cleared the input: clear selection and report empty value (do not restore from selected)
      if (!inputValue) {
        onSingleChange?.({
          value: "",
          label: "",
        });
        setSelected([]);
        onValueChange?.("");
        return;
      }

      const hasMatch =
        inputValue !== "" &&
        options.some(
          (option) =>
            isRegularOption(option) &&
            (option.label === inputValue || option.value === inputValue),
        );

      if (freeSolo && !hasMatch && inputValue.trim() !== "") {
        const customOption: ComboboxOption = {
          value: inputValue,
          label: inputValue,
        };
        onValueChange?.(inputValue);
        onSingleChange?.(customOption);
      } else if (hasMatch || selected.length > 0) {
        const label = getOptionLabel(selected[0]) || inputValue;
        setInputValue(label);
        const option = selected[0];
        const optionLabel = isRegularOption(option) ? option.label : "";
        onValueChange?.(optionLabel != null ? String(optionLabel) : "");
      } else {
        setInputValue("");
        onValueChange?.("");
        onSingleChange?.({
          value: "",
          label: "",
        });
        setSelected([]);
      }
    },
    [
      loading,
      multiple,
      inputValue,
      options,
      selected,
      onSingleChange,
      onValueChange,
      freeSolo,
    ],
  );

  // Sync effects
  useEffect(() => {
    const newSelected = getSelectedOptions(value);
    setSelected(newSelected);
    if (!multiple && !isFocused) {
      setInputValue(
        newSelected.length > 0
          ? getOptionLabel(newSelected[0]) || value?.toString() || ""
          : (value?.toString() ?? ""),
      );
    }
  }, [value, getSelectedOptions, multiple, isFocused]);

  // useEffect(() => {
  //   if (!multiple) {
  //     // When something is selected, show its label. When nothing is selected, use value
  //     // so that search-as-you-type comboboxes (e.g. Geocoder) preserve user input.
  //     const newInputValue =
  //       selected.length > 0
  //         ? getOptionLabel(selected[0]) || value?.toString() || ""
  //         : (value?.toString() ?? "");
  //     setInputValue(newInputValue);
  //   }
  // }, [selected, multiple, value]);

  useEffect(() => setOpen(openProp), [openProp]);
  useEffect(() => onOpenChange?.(open), [open, onOpenChange]);

  // Scroll input into view when opened (especially on mobile when keyboard appears)
  useEffect(() => {
    if (open && inputRef && "current" in inputRef && inputRef.current) {
      // Small delay to allow keyboard to appear first
      setTimeout(() => {
        inputRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 300);
    }
  }, [open, inputRef]);

  // Handle pending blur check
  useEffect(() => {
    if (pendingBlurCheck && !loading) {
      setPendingBlurCheck(false);
      validateInput();
    }
  }, [pendingBlurCheck, loading, validateInput]);

  // Update highlighted index based on input (only when input or options change)
  const setHighlightedIndexOnInputChange = useCallback(
    (searchValue?: string) => {
      if (justSelected.current) {
        justSelected.current = false;
        return;
      }
      const lowerInput = (searchValue ?? inputValue).toLowerCase();

      // Match priority: exact -> startsWith -> includes.
      let index =
        lowerInput === ""
          ? -1
          : options.findIndex((option) => {
              if (!isSelectableOption(option) || !isRegularOption(option))
                return false;
              return option.label?.toLowerCase() === lowerInput;
            });

      if (index === -1 && lowerInput) {
        index = options.findIndex((option) => {
          if (!isSelectableOption(option) || !isRegularOption(option))
            return false;
          const label = option.label?.toLowerCase();
          const subLabel = option.subLabel?.toLowerCase();
          const value = option.value?.toString().toLowerCase();
          return (
            label?.startsWith(lowerInput) ||
            subLabel?.startsWith(lowerInput) ||
            value?.startsWith(lowerInput)
          );
        });
      }

      if (index === -1 && lowerInput) {
        index = options.findIndex((option) => {
          if (!isSelectableOption(option) || !isRegularOption(option))
            return false;
          const { label, subLabel, value } = option;
          return (
            label?.toLowerCase().includes(lowerInput) ||
            subLabel?.toLowerCase().includes(lowerInput) ||
            value?.toString().toLowerCase().includes(lowerInput)
          );
        });
      }

      // If we found a match, use it. Otherwise, reset to first selectable option
      if (index > -1) {
        setHighlightedIndex(index);
      } else {
        // No match found - reset to first selectable option so navigation works
        const firstSelectable = navigationHelpers.findFirst();
        if (firstSelectable > -1) {
          setHighlightedIndex(firstSelectable);
        }
      }
    },
    [inputValue, options, navigationHelpers],
  );

  // Separate effect to validate highlighted index (only when options change)
  useEffect(() => {
    if (!isSelectableOption(options[highlightedIndex])) {
      const firstSelectable = navigationHelpers.findFirst();
      if (firstSelectable > -1) setHighlightedIndex(firstSelectable);
    }
  }, [options, navigationHelpers, highlightedIndex]);

  // Event handlers
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (enableSearch) {
      setTimeout(() => setOpen(true), 100);
    }
  }, [enableSearch]);
  const handleClick = useCallback(() => {
    setOpen((e) => (enableSearch ? true : !e));
  }, [enableSearch]);

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      validateInput(true);
      onBlur?.(event);
      if (!inputValue && value)
        setInputValue(getOptionLabel(getSelectedOptions(value)[0]) || "");
    },
    [validateInput, onBlur],
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      setInputValue(newValue || "");
      onValueChange?.(newValue);
      setHighlightedIndexOnInputChange(newValue || "");

      const lower = newValue?.toLowerCase() ?? "";
      const hasMatchingOption =
        !lower ||
        options.some(
          (opt) =>
            isRegularOption(opt) &&
            (opt.label?.toLowerCase().includes(lower) ||
              opt.value?.toString().toLowerCase().includes(lower)),
        );
      setOpen(freeSolo ? hasMatchingOption : true);

      if (!newValue && !multiple) {
        onSingleChange?.({
          value: "",
          label: "",
        });
        setSelected([]);
      }
    },
    [
      multiple,
      freeSolo,
      options,
      onSingleChange,
      onValueChange,
      setHighlightedIndexOnInputChange,
    ],
  );

  // Handle comma-separated input for multiple selection
  const handleCommaSeparatedInput = useCallback(() => {
    if (!multiple || !inputValue.includes(",")) return;

    const inputValues = inputValue
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    const matchedOptions: ComboboxOption[] = [];

    for (const val of inputValues) {
      const matchedOption = options.find(
        (option) =>
          isRegularOption(option) &&
          !option.disabled &&
          (option.label.toLowerCase() === val.toLowerCase() ||
            option.value.toString().toLowerCase() === val.toLowerCase()),
      );

      if (matchedOption && isRegularOption(matchedOption)) {
        // Only add if not already selected
        const isAlreadySelected = selected.some(
          (item) => isRegularOption(item) && item.value === matchedOption.value,
        );
        if (!isAlreadySelected) {
          matchedOptions.push(matchedOption);
        }
      }
    }

    if (matchedOptions.length > 0) {
      const newSelected = [...selected, ...matchedOptions];
      setSelected(newSelected);
      onChange?.(newSelected);
      setInputValue("");
      onValueChange?.("");
    }
  }, [multiple, inputValue, options, selected, onChange, onValueChange]);

  const handleOptionSelect = useCallback(
    (option: ComboboxOption) => {
      if (!isRegularOption(option)) return;

      const newHighlightedIndex = options.findIndex(
        (opt) => isRegularOption(opt) && opt.value === option.value,
      );

      if (newHighlightedIndex !== -1) {
        setHighlightedIndex(newHighlightedIndex);
      }

      setTimeout(() => {
        if (multiple) {
          const isSelected = selected.some(
            (item) => isRegularOption(item) && item.value === option.value,
          );
          const newSelected = isSelected
            ? selected.filter(
                (item) =>
                  !(isRegularOption(item) && item.value === option.value),
              )
            : [...selected, option];
          setSelected(newSelected);
          (onChange as ((option: ComboboxOption[]) => void) | undefined)?.(
            newSelected,
          );
          justSelected.current = true;
          setInputValue("");
          onValueChange?.("");
        } else {
          setSelected([option]);
          (onChange as ((option: ComboboxOption) => void) | undefined)?.(
            option,
          );
          setInputValue(getOptionLabel(option));
          setOpen(false);
        }
      });
    },
    [multiple, selected, onChange, onValueChange, options],
  );

  const clearSelection = useCallback(() => {
    setSelected([]);
    (onChange as ((option: ComboboxOption[]) => void) | undefined)?.([]);
    setInputValue("");
    onValueChange?.("");
  }, [onChange, onValueChange]);

  const handleRemoveOption = useCallback(
    (optionToRemove: ComboboxOption) => {
      if (!isRegularOption(optionToRemove)) return;

      const newSelected = selected.filter(
        (item) =>
          !(isRegularOption(item) && item.value === optionToRemove.value),
      );
      setSelected(newSelected);
      if (multiple) {
        (onChange as ((option: ComboboxOption[]) => void) | undefined)?.(
          newSelected,
        );
      } else {
        (onChange as ((option: ComboboxOption) => void) | undefined)?.(
          newSelected[0] || { value: "", label: "" },
        );
        setInputValue(
          newSelected[0] && isRegularOption(newSelected[0])
            ? getOptionLabel(newSelected[0])
            : "",
        );
        onValueChange?.(
          newSelected[0] && isRegularOption(newSelected[0])
            ? String(newSelected[0].value)
            : "",
        );
      }
    },
    [selected, multiple, onChange, onValueChange],
  );

  const selectHighlightedOption = useCallback(() => {
    const match = inputValue
      ? options.find(
          (option) =>
            isRegularOption(option) &&
            !option.disabled &&
            option.label?.toLowerCase() === inputValue.toLowerCase(),
        )
      : undefined;
    if (match) {
      handleOptionSelect(match);
    } else if (freeSolo && !multiple && inputValue.trim() !== "") {
      const customOption: ComboboxOption = {
        value: inputValue,
        label: inputValue,
      };
      onSingleChange?.(customOption);
      onValueChange?.(inputValue);
    } else {
      const option = selected[0];
      const label = getOptionLabel(option);
      const optionValue = isRegularOption(option) ? option.value : "";
      const valueStr = optionValue != null ? String(optionValue) : "";
      if (!multiple) setInputValue(label);
      onValueChange?.(valueStr);
    }
  }, [
    options,
    inputValue,
    selected,
    freeSolo,
    onValueChange,
    handleOptionSelect,
    multiple,
    onSingleChange,
  ]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (props.disabled) return;

      const keyActions: Record<string, () => void> = {
        Backspace: () => {
          if (multiple && !inputValue && selected.length > 0) {
            event.preventDefault();
            if (event.metaKey) {
              clearSelection();
            } else {
              handleRemoveOption(selected[selected.length - 1]);
            }
          }
        },
        Enter: () => {
          event.preventDefault();
          if (multiple && inputValue.includes(",")) {
            handleCommaSeparatedInput();
            return;
          }
          const option = options[highlightedIndex];
          if (open && isSelectableOption(option)) {
            handleOptionSelect(option);
          } else if (freeSolo) {
            selectHighlightedOption();
            setOpen(false);
          }
        },
        ",": () => {
          if (multiple) {
            event.preventDefault();
            handleCommaSeparatedInput();
          }
        },
        Tab: () => {
          selectHighlightedOption();
          setOpen(false);
        },
        Escape: () => {
          const highlightedOption = options[highlightedIndex];
          if (
            isRegularOption(highlightedOption) &&
            inputValue === highlightedOption.label
          ) {
            handleOptionSelect(highlightedOption);
          } else {
            const option = selected[0];
            const label = getOptionLabel(option);
            const optionLabel = isRegularOption(option) ? option.label : "";
            const valueStr = optionLabel != null ? String(optionLabel) : "";
            setInputValue(label);
            onValueChange?.(valueStr);
          }
          setOpen(false);
        },
        ArrowDown: () => {
          event.preventDefault();
          if (!open) {
            setOpen(true);
          } else {
            const nextIndex = navigationHelpers.findNext(highlightedIndex);
            if (nextIndex > -1) setHighlightedIndex(nextIndex);
            setInputValue(getOptionLabel(options[nextIndex]));
            // onChange?.(options[nextIndex]);
          }
        },
        ArrowUp: () => {
          event.preventDefault();
          if (open) {
            const prevIndex = navigationHelpers.findPrev(highlightedIndex);
            if (prevIndex > -1) setHighlightedIndex(prevIndex);
            setInputValue(getOptionLabel(options[prevIndex]));
            // onChange?.(options[prevIndex]);
          }
        },
        Home: () => {
          if (open) {
            event.preventDefault();
            const firstIndex = navigationHelpers.findFirst();
            if (firstIndex > -1) setHighlightedIndex(firstIndex);
          }
        },
        End: () => {
          if (open) {
            event.preventDefault();
            const lastIndex = navigationHelpers.findLast();
            if (lastIndex > -1) setHighlightedIndex(lastIndex);
          }
        },
      };

      keyActions[event.key]?.();
    },
    [
      props.disabled,
      multiple,
      inputValue,
      selected,
      open,
      highlightedIndex,
      options,
      handleRemoveOption,
      handleOptionSelect,
      freeSolo,
      onValueChange,
      navigationHelpers,
      selectHighlightedOption,
      handleCommaSeparatedInput,
      clearSelection,
    ],
  );

  // Scroll management
  const scrollToHighlighted = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      if (highlightedIndex >= 0 && listRef.current) {
        const element = listRef.current.children[
          highlightedIndex
        ] as HTMLElement;
        element?.scrollIntoView({ block: "nearest", behavior });
      }
    },
    [highlightedIndex],
  );

  useEffect(() => scrollToHighlighted(), [scrollToHighlighted]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: scrollToHighlighted should only be called when open is true
  useEffect(() => {
    if (open) setTimeout(() => scrollToHighlighted("instant"));
  }, [open]);

  const handleClearInput = useCallback(() => {
    setInputValue("");
    onValueChange?.("");
    if (!multiple) {
      onSingleChange?.({
        value: "",
        label: "",
      });
      setSelected([]);
    }
  }, [multiple, onSingleChange, onValueChange]);

  // Clear icon should be predictable:
  // - only when searchable
  // - only when there's something to clear
  // - only when the control is focused or the list is open
  const clearable =
    enableSearch && inputValue.length > 0 && (isFocused || open);

  const { trailingIcon, trailingIconProps } = useMemo(() => {
    const icon =
      trailingIconProp ??
      (clearable
        ? "x-md"
        : options.length > 0
          ? "arrowhead-down-md"
          : undefined);

    const iconProps = {
      tabIndex: -1,
      ...trailingIconPropsProp,
    };
    if (clearable && !trailingIconPropsProp?.onClick) {
      iconProps.onClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        handleClearInput();
      };
      // Prevent focusing/toggling when pressing the clear icon.
      iconProps.onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
      };
    }
    return { trailingIcon: icon, trailingIconProps: iconProps };
  }, [
    trailingIconProp,
    clearable,
    options.length,
    trailingIconPropsProp,
    handleClearInput,
  ]);

  const transitions = useTransition(options.length > 0 && open ? [1] : [], {
    from: {
      opacity: 0,
      "--scaleY": 0.92,
      "--scaleX": 0.97,
      "--offset": 10,
    },
    enter: {
      opacity: 1,
      "--scaleY": 1,
      "--scaleX": 1,
      "--offset": 0,
    },
    leave: {
      opacity: 0,
      "--scaleY": 0.92,
      "--scaleX": 0.97,
      "--offset": 10,
    },
    config: springConfig.snappy,
  });
  const InnerContent = animated.div as React.ComponentType<{
    children: React.ReactNode;
    className: string;
    style: React.ComponentProps<typeof animated.div>["style"];
  }>;
  const triggerElement =
    inputRef && "current" in inputRef ? inputRef.current : null;
  const modalStack = useMemo(
    () =>
      typeof document !== "undefined"
        ? document.getElementById("modal-stack")
        : null,
    [],
  );
  const triggerInModal = Boolean(
    modalStack && triggerElement && modalStack.contains(triggerElement),
  );
  const portalContainer = triggerInModal ? modalStack : undefined;
  const baseContentZIndex =
    typeof dropdownZIndex === "number"
      ? dropdownZIndex
      : triggerInModal
        ? Z_INDEX.DROPDOWN_INSIDE_MODAL
        : Z_INDEX.DROPDOWN_OVERLAY;
  const contentZIndex = useMemo(
    () => resolveOverlayZIndex(triggerElement, baseContentZIndex),
    [triggerElement, baseContentZIndex],
  );

  const modalValue = Array.isArray(value) ? value.join(", ") : value;

  if (asModal && isMobile) {
    return (
      <ModalButton
        variant="basic"
        pillShaped={false}
        className={cn("w-full justify-start", props.className)}
        classNames={{
          text: "!line-clamp-1 text-left -my-2 py-2",
        }}
        leadingIcon={leadingIcon}
        trailingIcon="arrowhead-down-lg"
        text={
          multiple
            ? selected.length > 0
              ? selected
                  .map((s) => (isRegularOption(s) ? s.label : ""))
                  .join(", ")
              : modalValue || placeholder
            : selected.length > 0 && isRegularOption(selected[0])
              ? selected[0].label
              : modalValue || placeholder
        }
        size="lg"
        disabled={props.disabled}
        options={{
          title: placeholder || props.label || t("global:select"),
          swipe: true,
        }}
      >
        <div className="px-3 pb-5">
          {options.map((option) => {
            if (isDividerOption(option)) {
              return (
                <div
                  key={`divider-${Math.random()}`}
                  className="flex flex-col w-full"
                >
                  <Seperator
                    className="w-[calc(100%-20px)] ml-2.5 my-0 py-0"
                    orientation="horizontal"
                  />
                </div>
              );
            }

            if (!isRegularOption(option)) return null;

            return (
              <div
                key={
                  option.value ||
                  `item-${option.label}-${option.subLabel || ""}`
                }
                className="flex flex-col w-full"
              >
                <ListItem
                  leadingIcon={option.leadingIcon}
                  primaryContent={option.label}
                  secondaryContent={option.subLabel}
                  classNames={{
                    base: "h-12",
                  }}
                  onClick={() => {
                    handleOptionSelect(option);
                    setTimeout(() => closeModal(), 300);
                  }}
                />
                <Seperator
                  className="w-[calc(100%-20px)] ml-2.5 my-0 py-0"
                  orientation="horizontal"
                />
              </div>
            );
          })}
        </div>
      </ModalButton>
    );
  }

  return (
    <Root
      open={options.length > 0 && open}
      onOpenChange={(isOpen) => {
        if (props.disabled) return;
        // Do not auto-select on dismiss (outside click / Escape / blur).
        // Selection should only happen via explicit option interaction or keyboard confirm.
        setOpen(isOpen);
      }}
    >
      <Input
        {...({ ...props, type: inputType, stepper: numberStepper } as Exclude<
          InputProps,
          TextareaProps
        >)}
        ref={inputRef}
        leadingIcon={leadingIcon}
        trailingIcon={trailingIcon}
        trailingIconProps={trailingIconProps}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        readOnly={!enableSearch}
        autoComplete="off"
        role="combobox"
        placeholder={selected.length ? "" : placeholder}
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        data-testid="combobox-input"
        aria-activedescendant={
          open && highlightedIndex >= 0 && highlightedIndex < options.length
            ? `${listboxId}-option-${highlightedIndex}`
            : undefined
        }
        prepend={
          multiple && selected?.length ? (
            <SelectedOptionsTags
              items={options
                .filter((e) =>
                  selected.some(
                    (s) => isRegularOption(s) && s.value === e.value,
                  ),
                )
                .filter(isRegularOption)
                .map((opt) => ({
                  label: opt.label,
                  value: opt.value,
                  color: opt.color,
                }))}
              type={typeof multiple === "string" ? multiple : "plain"}
              onRemove={(item) => {
                const option = selected.find(
                  (o) => isRegularOption(o) && o.value === item.value,
                );
                if (option) handleRemoveOption(option);
              }}
            />
          ) : (
            props.prepend
          )
        }
        triggerWrapper={(el) => (
          <Trigger
            asChild
            className="flex items-center w-full cursor-default"
            onMouseEnter={() => setWasOpen(open)}
            onClick={(e) => {
              if (props.disabled) return;
              const target = e.target as HTMLElement;
              if (target.tagName === "LABEL") {
                inputRef.current?.focus();
              }
              if (wasOpen === open) handleClick();
              e.preventDefault();
            }}
            tabIndex={-1}
          >
            {el}
          </Trigger>
        )}
        classNames={{
          ...classNames,
          inputContainer: cn(
            typeof multiple === "string" &&
              multiple === "tag" &&
              selected?.length &&
              "[--input-ps:0.5rem]",
            // Make focus obvious for mouse users too (not just :focus-visible),
            // since we show the clear icon on mouse focus.
            "has-[:focus]:ring-2 has-[:focus]:ring-focused-default has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focused-default",
            classNames?.inputContainer,
            !enableSearch && "cursor-pointer",
          ),
          input: cn(
            classNames?.input,
            !enableSearch && "cursor-pointer select-none",
          ),
          inputWrapper: cn(
            classNames?.inputWrapper,
            "flex-wrap gap-x-0 gap-y-2",
            !props.labelOutside && "gap-y-0",
          ),
        }}
      />

      {transitions((styles, item) => {
        return item ? (
          <Portal forceMount container={portalContainer}>
            <Content
              side={openTop ? "top" : "bottom"}
              sideOffset={4}
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
              ref={dropdownRef}
              collisionPadding={8}
              avoidCollisions={false}
              sticky="partial"
              style={{ zIndex: contentZIndex }}
            >
              <InnerContent
                className={cn(
                  popoverContentVariants(),
                  "cursor-auto",
                  "[[data-side='top']>&]:translate-y-[calc(var(--offset)*1px)] [[data-side='bottom']>&]:translate-y-[calc(var(--offset)*-1px)]",
                  "scale-y-[var(--scaleY)] scale-x-[var(--scaleX)] ",
                )}
                style={{
                  ...styles,
                  transformOrigin:
                    "var(--radix-popover-content-transform-origin)",
                }}
              >
                <div
                  role="listbox"
                  ref={listRef}
                  className={cn(
                    "group/listbox overflow-auto p-1 flex flex-col gap-1",
                    multiple || footerSlot
                      ? "max-h-[min(calc(var(--radix-popover-content-available-height)-54px-5px),380px)]"
                      : "max-h-[min(calc(var(--radix-popover-content-available-height)-5px),380px)]",
                  )}
                  id={listboxId}
                  aria-label={props.label || t("global:options")}
                  tabIndex={-1}
                >
                  {loading ? (
                    <div className="p-5 text-center text-sm text-text-subdued flex justify-center items-center w-full">
                      <Icon name="loading" aria-hidden="true" />
                      <span className="sr-only">{t("global:loading")}</span>
                    </div>
                  ) : (
                    options.map((option, index) => {
                      return (
                        <Option
                          key={option.value}
                          option={option}
                          index={index}
                          selected={selected}
                          listboxId={listboxId}
                          highlightedIndex={highlightedIndex}
                          handleOptionSelect={handleOptionSelect}
                          classNames={classNames}
                        />
                      );
                    })
                  )}
                </div>
                {(footerSlot || multiple) && (
                  <div className="sticky bottom-0 flex w-full items-center justify-end gap-2 border-t border-border-subdued p-2 bg-surface-default rounded-b-xl">
                    {footerSlot && (
                      <div className="flex min-w-0 flex-1">{footerSlot}</div>
                    )}
                    {multiple && (
                      <div className="flex shrink-0 justify-end gap-1">
                        <Button
                          text={t("global:reset")}
                          width="max"
                          disabled={!selected.length}
                          onClick={() => {
                            clearSelection();
                            setOpen(false);
                          }}
                        />
                        <Button
                          variant="primary"
                          text={t("global:done")}
                          width="max"
                          onClick={() => setOpen(false)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </InnerContent>
            </Content>
          </Portal>
        ) : null;
      })}
    </Root>
  );
};
