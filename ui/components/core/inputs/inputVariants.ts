/** biome-ignore-all lint/nursery/noSecrets: what biome thinks are secrets are just complex arbitrary tw classes */
import { tv } from "tailwind-variants";

export const inputVariants = tv({
  slots: {
    container: ["group/input-container gap-y-1 flex flex-col w-full"],
    inputContainer: [
      "text-base",
      "[--input-px:0.75rem] [--input-ps:var(--input-px)] [--input-pe:var(--input-px)] [--input-py:0.75rem] [--input-pt:var(--input-py)] [--input-pb:var(--input-py)]",
      "ps-[var(--input-ps)] pe-[var(--input-pe)]",
      "relative cursor-text flex items-center rounded-xl w-full bg-surface-subdued duration-100 outline-none gap-2",
      "ring-inset ring-1 ring-border-subdued no-touch:hover:ring-border-default has-[:focus-visible]:ring-2 touch-any:has-[:focus-visible]:ring-focused-default",
      "data-[state=open]:ring-2 touch-any:data-[state=open]:ring-focused-default focus-visible:ring-2 touch-any:focus-visible:ring-focused-default",
      "has-[input:-webkit-autofill]:bg-[var(--palette-yellow-100)] has-[input:-webkit-autofill]:ring-[var(--palette-yellow-400)]",
      "no-touch:hover:has-[input:-webkit-autofill]:bg-[var(--palette-yellow-100)] no-touch:hover:has-[input:-webkit-autofill]:ring-[var(--palette-yellow-400)]",
      "has-[:focus-visible]:has-[input:-webkit-autofill]:bg-[var(--palette-yellow-100)] has-[:focus-visible]:has-[input:-webkit-autofill]:ring-[var(--palette-yellow-400)]",
      "[--border-width:1px] has-[:focus-visible]:[--border-width:2px]",
      "[&:has(:focus-visible)_.mdxeditor-toolbar]:!opacity-100 [&:has(:focus-visible)_[contenteditable]+div]:!text-text-placeholder",
      "disabled:opacity-50 has-[:is(:disabled,[aria-disabled='true'])]:cursor-default has-[:is(:disabled,[aria-disabled='true'])]:!ring-border-subdued",
    ],
    inputWrapper: [
      "relative flex min-w-0 w-full gap-1 items-baseline self-start pt-[var(--input-pt)] pb-[var(--input-pb)]",
    ],
    input: [
      "peer/input w-auto grow bg-transparent outline-none border-none p-0 min-w-0",
      "placeholder:text-text-subdued focus-visible:placeholder:text-text-placeholder",
      "disabled:opacity-50",
      "autofill:[-webkit-text-fill-color:var(--text-default)]",
      "no-touch:hover:autofill:[-webkit-text-fill-color:var(--text-default)]",
      "focus-visible:autofill:[-webkit-text-fill-color:var(--text-default)]",
      "leading-none",
    ],
    richTextEditor: [
      "[&_[contenteditable]+div]:!text-text-subdued",
      "[&_[contenteditable]]:py-[var(--input-py)] [&_[contenteditable]+div]:py-[var(--input-py)]",
    ],
    label: [
      "text-text-subdued absolute start-[var(--input-ps)] transition-all duration-500 ease-expressive-out pointer-events-none",
      "cursor-text select-none origin-left w-max truncate",
      "max-w-[calc((100%-var(--leading-icon-offset,0px)-var(--trailing-icon-offset,0px)-var(--icon-gap,0px)-var(--input-ps,0px)-var(--input-pe,0px))/var(--scaled))]",
    ],
    leadingIcon: [
      "-mx-1 p-1 text-icon-default rounded-2xl shrink-0",
      "[:is(:disabled,[aria-disabled='true'])>&]:text-icon-disabled",
    ],
    leadingIconWrapper: [""],
    trailingIcon: [
      "-mx-1 p-1 text-icon-default rounded-2xl shrink-0",
      "[:is(:disabled,[aria-disabled='true'])>&]:text-icon-disabled",
    ],
    trailingIconWrapper: [""],
    stepper: [
      "group/stepper absolute flex flex-col justify-center border-l text-border-subdued border-current",
      "end-[var(--border-width)] top-[var(--border-width)] bottom-[var(--border-width)]",
    ],
    stepperButton: [
      "flex items-center justify-center w-8 p-0 pe-px me-[calc(2px-var(--border-width))] text-text-subdued duration-100 shrink-0",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focused-default",
      "disabled:opacity-50",
      "bg-transparent no-touch:hover:bg-transparent touch-any:active:bg-transparent",
      "[&:not([disabled])]:no-touch:hover:!text-text-default",
      "no-touch:group-hover/stepper:group-[&:not(:has([disabled]))]/stepper:text-text-placeholder",
    ],
    stepperDivider: ["border-b border-solid border-current"],
    helperText: ["text-xs text-text-subdued"],
  },
  variants: {
    isRich: {
      true: {
        inputContainer: [
          "[&:has([data-text-enhancement-preview=true])]:animate-ai-pulse",
          "[&:has([data-text-enhancement-preview=true])]:text-[var(--pulse-color)]",
          "[&:has([data-text-enhancement-preview=true])]:ring-2",
          "[&:has([data-text-enhancement-preview=true])]:ring-[var(--pulse-color)]",
          "[&:has([data-text-enhancement-preview=true])_p>span]:text-text-default",
          "[&:has([data-text-enhancement-preview=true])_code]:rounded",
          "[&:has([data-text-enhancement-preview=true])_code]:bg-green-700/10",
          "[&:has([data-text-enhancement-preview=true])_code]:text-green-600",
          "[&:has([data-text-enhancement-preview=true])_code]:p-0",
          "[&:has([data-text-enhancement-preview=true])_code]:border-none",
          "[&:has([data-text-enhancement-preview=true])_code>span]:bg-transparent",
          "[&:has([data-text-enhancement-preview=true])_code>span]:px-1",
          "[&:has([data-text-enhancement-preview=true])_code>span]:py-0",
          "[&:has([data-text-enhancement-preview=true])_code>span]:text-[1em]",
          "[&:has([data-text-enhancement-preview=true])_code>span]:font-sans",
          "[&:has([data-text-enhancement-preview=true])_s]:text-palette-red-600",
        ],
        richTextEditor: [
          "[&_[contenteditable]]:-m-3 [&_[contenteditable]]:!px-3 [&_[contenteditable]]:w-auto",
          "[&_.mdxeditor-toolbar]:-translate-y-full [&_.mdxeditor-toolbar]:pointer-events-all",
          "[&_.mdxeditor-toolbar]:-my-[0.5px]",
        ],
      },
      false: {},
    },
    size: {
      md: {
        container: "[--stepper-width:1.5rem]",
        inputContainer: "min-h-9 [--input-py:0.4375rem]",
        stepperButton: "h-4",
      },
      lg: {
        inputContainer: "min-h-11 [--input-py:0.6875rem]",
        stepperButton: "h-5",
      },
      xl: {
        inputContainer: "min-h-14 [--input-py:1.0625rem]",
        stepperButton: "h-6",
      },
    },
    hasLabel: {
      true: { label: "top-1" },
      false: { label: "top-1/2 -translate-y-1/2" },
    },
    labelOutside: {
      true: {
        label:
          "static text-sm !translate-y-0 !text-text-default pointer-events-auto cursor-default",
      },
      false: {
        label:
          "absolute start-[var(--input-ps)] transition-all duration-200 ease-expressive-out pointer-events-none cursor-text select-none origin-left",
      },
    },
    silent: {
      true: {
        inputContainer: [
          "bg-transparent ring-transparent w-auto",
          "ps-[var(--input-ps)] pe-[var(--input-pe)] -ms-[var(--input-ps)] -me-[calc(var(--input-pe)-var(--stepper-width,0px))]",
        ],
        inputWrapper: "h-full items-center",
        stepper: "border-none",
        stepperDivider: "border-none",
      },
      false: {},
    },
    hasError: {
      true: {
        inputContainer:
          "ring-border-critical-default has-[:focus-visible]:ring-border-critical-default no-touch:hover:ring-border-critical-subdued",
        label: "text-text-critical",
        helperText: "text-text-critical",
      },
      false: {},
    },
    hasSuccess: {
      true: {
        inputContainer:
          "ring-border-success-default touch-any:has-[:focus-visible]:ring-border-success-default no-touch:hover:ring-border-success-subdued",
        label: "text-text-success",
        helperText: "text-text-success",
      },
      false: {},
    },
    hasLeadingIcon: {
      true: {
        input: "",
        label:
          "start-[calc(12px+var(--leading-icon-offset,0px))] [--leading-icon-offset:28px] [--icon-gap:0.5rem]",
      },
      false: {},
    },
    hasTrailingIcon: {
      true: {
        label:
          "end-[calc(12px+var(--trailing-icon-offset,0px))] [--trailing-icon-offset:28px] [--icon-gap:0.5rem]",
      },
      false: {},
    },
    hasStepper: {
      true: {
        container: "[--stepper-width:2rem]",
        inputContainer:
          "[--input-pe:calc(var(--input-px)+var(--stepper-width,0px))]",
        label: "end-8",
      },
      false: {},
    },
    isFloating: {
      true: { label: "scale-[var(--scaled)] text-text-subdued cursor-default" },
      false: {
        label: [
          "top-1/2 -translate-y-1/2 text-text-subdued peer-autofill/input:top-1 peer-autofill/input:translate-y-0 peer-autofill/input:scale-[var(--scaled)] peer-autofill/input:text-text-subdued",
        ],
      },
    },
    type: {
      textarea: {
        inputContainer: "h-auto items-start",
        input:
          "resize-none block leading-snug -mt-[calc(var(--input-pt)-var(--border-width))] -mb-[calc(var(--input-pb)-var(--border-width))] pt-[calc(var(--input-pt)-var(--border-width))] pb-[calc(var(--input-pb)-var(--border-width))]",
      },
      number: {
        input: [
          "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0",
          "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0",
          "[&[type=number]]:[-moz-appearance:textfield]",
        ],
      },
      email: {},
      password: {},
      search: {
        input: [
          "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-cancel-button]:m-0",
          "[&::-webkit-search-decoration]:appearance-none [&::-webkit-search-decoration]:m-0",
        ],
      },
      tel: {},
      text: {},
      url: {},
    },
    trailingIconClickable: {
      true: {
        trailingIcon:
          "cursor-pointer no-touch:hover:text-text-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focused-black",
      },
      false: { trailingIcon: "pointer-events-none" },
    },
    disabled: {
      true: {
        leadingIcon: "pointer-events-none cursor-default text-icon-disabled",
        trailingIcon: "pointer-events-none cursor-default text-icon-disabled",
      },
      false: {},
    },
  },
  compoundVariants: [
    {
      size: "md",
      hasLabel: true,
      labelOutside: false,
      class: { inputContainer: "[--input-pt:0.875rem] [--input-pb:0rem]" },
    },
    {
      size: "lg",
      hasLabel: true,
      labelOutside: false,
      class: { inputContainer: "[--input-pt:1.25rem] [--input-pb:0.125rem]" },
    },
    {
      size: "xl",
      hasLabel: true,
      labelOutside: false,
      class: { inputContainer: "[--input-pt:1.75rem] [--input-pb:0.375rem]" },
    },
    {
      size: "md",
      isFloating: true,
      labelOutside: false,
      class: { label: "top-0.5" },
    },
    {
      size: "lg",
      isFloating: true,
      labelOutside: false,
      class: { label: "top-1" },
    },
    {
      size: "xl",
      isFloating: true,
      labelOutside: false,
      class: { label: "top-2" },
    },
    {
      labelOutside: true,
      hasLeadingIcon: true,
      class: { label: "static text-text-default text-sm translate-y-0" },
    },
    {
      type: "textarea",
      hasLabel: true,
      isFloating: true,
      labelOutside: false,
      class: {
        label:
          "top-1 scale-[var(--scaled)] text-text-subdued bg-surface-subdued ring-[5px] ring-surface-subdued rounded",
      },
    },
    {
      type: "textarea",
      hasLabel: true,
      isFloating: false,
      labelOutside: false,
      class: { label: "top-[1.375rem] text-text-subdued" },
    },
    {
      type: "textarea",
      labelOutside: true,
      class: { label: "static text-text-default text-sm translate-y-0" },
    },
    {
      type: "textarea",
      size: "md",
      class: { leadingIconWrapper: "mt-1.5", trailingIconWrapper: "mt-1.5" },
    },
    {
      type: "textarea",
      size: "lg",
      class: { leadingIconWrapper: "mt-2", trailingIconWrapper: "mt-2" },
    },
    {
      type: "textarea",
      size: "xl",
      class: { leadingIconWrapper: "mt-3", trailingIconWrapper: "mt-3" },
    },
    {
      isRich: true,
      size: "md",
      class: {
        inputContainer: "[--input-py:0.6225rem]",
        richTextEditor: ["[&_.mdxeditor-toolbar]:!top-0.5"],
      },
    },
    {
      isRich: true,
      size: "lg",
      class: {
        inputContainer: "[--input-py:0.8rem]",
        richTextEditor: ["[&_.mdxeditor-toolbar]:!top-0"],
      },
    },
    {
      isRich: true,
      size: "xl",
      class: {
        inputContainer: "[--input-py:1rem]",
        richTextEditor: [
          "[&_.mdxeditor-toolbar]:!top-1 [&_.mdxeditor-toolbar]:!rounded-md",
        ],
      },
    },
    {
      isRich: true,
      hasLabel: true,
      labelOutside: false,
      class: { richTextEditor: "[&_.mdxeditor-toolbar]:!rounded-md" },
    },
  ],
  defaultVariants: {
    size: "lg",
    hasError: false,
    hasSuccess: false,
    hasLeadingIcon: false,
    hasTrailingIcon: false,
    hasStepper: false,
    type: undefined,
    trailingIconClickable: false,
    labelOutside: false,
    singleRow: false,
    silent: false,
    isRich: false,
    disabled: false,
  },
});
