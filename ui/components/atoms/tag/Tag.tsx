/** @format */

import React, { type MouseEventHandler, memo, useMemo, useState } from "react";
import { TAG_COLOR_KEY_SET } from "@shared/utils/tagChartColors";
import { tv, type VariantProps } from "tailwind-variants";
import { useOnClickOutside } from "../../../hooks/useOnClickOutside";
import { adaptColorBrightness } from "../../../styles/helpers";
import { cn } from "../../../util/classNameConstructor";
import Icon from "../../core/icon/Icon";
import type { IconName } from "../../core/icon/names";

export const TagVariant = tv({
  base: [
    "group/tag relative inline-flex gap-0.5 h-6 min-w-6 flex-row items-center justify-center rounded-md px-1.5 py-0 focus-visible:outline-none focus-visible:ring-2 ring-offset-2 body-sm-bold text-start text-current",
    "overflow-hidden",
  ],
  variants: {
    hasRemoveIcon: {
      true: "",
      false: "",
    },
    selected: {
      true: "",
      false: "",
    },
    selectedState: {
      true: "",
      false: "",
    },
    color: {
      red: "bg-palette-red-300 text-palette-red-1000 ring-palette-red-500",
      "light-red":
        "bg-palette-red-200 text-palette-red-900 ring-palette-red-300",
      "dark-red":
        "bg-palette-red-400 text-palette-red-1000 ring-palette-red-600",
      rose: "bg-tag-surface-rose text-tag-text-rose ring-tag-surface-hover-rose",
      "light-rose":
        "bg-palette-rose-200 text-palette-rose-900 ring-palette-rose-300",
      "dark-rose":
        "bg-palette-rose-400 text-palette-rose-1000 ring-palette-rose-600",
      purple:
        "bg-tag-surface-purple text-tag-text-purple ring-tag-surface-hover-purple",
      "light-purple":
        "bg-palette-purple-200 text-palette-purple-900 ring-palette-purple-300",
      "dark-purple":
        "bg-palette-purple-400 text-palette-purple-1000 ring-palette-purple-600",
      blue: "bg-tag-surface-blue text-tag-text-blue ring-tag-surface-hover-blue",
      "light-blue":
        "bg-palette-blue-200 text-palette-blue-900 ring-palette-blue-300",
      "dark-blue":
        "bg-palette-blue-400 text-palette-blue-1000 ring-palette-blue-600",
      teal: "bg-tag-surface-teal text-tag-text-teal ring-tag-surface-hover-teal",
      "light-teal":
        "bg-palette-teal-200 text-palette-teal-900 ring-palette-teal-300",
      "dark-teal":
        "bg-palette-teal-400 text-palette-teal-1000 ring-palette-teal-600",
      green:
        "bg-palette-green-300 text-palette-green-1000 ring-palette-green-500",
      "light-green":
        "bg-palette-green-200 text-palette-green-900 ring-palette-green-300",
      "dark-green":
        "bg-palette-green-400 text-palette-green-1000 ring-palette-green-600",
      yellow:
        "bg-tag-surface-yellow text-tag-text-yellow ring-tag-surface-hover-yellow",
      "light-yellow":
        "bg-palette-yellow-200 text-palette-yellow-900 ring-palette-yellow-300",
      "dark-yellow":
        "bg-palette-yellow-400 text-palette-yellow-1000 ring-palette-yellow-600",
      "light-grey":
        "bg-tag-surface-light-grey text-tag-text-light-grey ring-tag-surface-hover-light-grey",
      grey: "bg-tag-surface-grey text-tag-text-grey ring-tag-surface-hover-grey",
      "dark-grey":
        "bg-palette-neutral-500 text-palette-neutral-1000 ring-palette-neutral-600",
      brown:
        "bg-tag-surface-brown text-tag-text-brown ring-tag-surface-hover-brown",
      "light-brown":
        "bg-palette-brown-200 text-palette-brown-900 ring-palette-brown-300",
      "dark-brown":
        "bg-palette-brown-400 text-palette-brown-1000 ring-palette-brown-600",
      orange:
        "bg-tag-surface-orange text-tag-text-orange ring-tag-surface-hover-orange",
      "light-orange":
        "bg-palette-orange-200 text-palette-orange-900 ring-palette-orange-300",
      "dark-orange":
        "bg-palette-orange-400 text-palette-orange-1000 ring-palette-orange-600",
    },
    interactive: {
      true: "cursor-pointer",
      false: "cursor-initial",
    },
  },
  compoundVariants: [
    {
      hasRemoveIcon: true,
      interactive: true,
      selectedState: true,
      class: "justify-start",
    },
    {
      hasRemoveIcon: true,
      interactive: true,
      class: ["hover:justify-start"],
    },
    {
      color: "red",
      interactive: true,
      class: "hover:bg-palette-red-400",
    },
    {
      color: "light-red",
      interactive: true,
      class: "hover:bg-palette-red-300",
    },
    {
      color: "dark-red",
      interactive: true,
      class: "hover:bg-palette-red-500",
    },
    {
      color: "rose",
      interactive: true,
      class: "hover:bg-tag-surface-hover-rose",
    },
    {
      color: "light-rose",
      interactive: true,
      class: "hover:bg-palette-rose-300",
    },
    {
      color: "dark-rose",
      interactive: true,
      class: "hover:bg-palette-rose-500",
    },
    {
      color: "purple",
      interactive: true,
      class: "hover:bg-tag-surface-hover-purple",
    },
    {
      color: "light-purple",
      interactive: true,
      class: "hover:bg-palette-purple-300",
    },
    {
      color: "dark-purple",
      interactive: true,
      class: "hover:bg-palette-purple-500",
    },
    {
      color: "blue",
      interactive: true,
      class: "hover:bg-tag-surface-hover-blue",
    },
    {
      color: "light-blue",
      interactive: true,
      class: "hover:bg-palette-blue-300",
    },
    {
      color: "dark-blue",
      interactive: true,
      class: "hover:bg-palette-blue-500",
    },
    {
      color: "teal",
      interactive: true,
      class: "hover:bg-tag-surface-hover-teal",
    },
    {
      color: "light-teal",
      interactive: true,
      class: "hover:bg-palette-teal-300",
    },
    {
      color: "dark-teal",
      interactive: true,
      class: "hover:bg-palette-teal-500",
    },
    {
      color: "green",
      interactive: true,
      class: "hover:bg-palette-green-400",
    },
    {
      color: "light-green",
      interactive: true,
      class: "hover:bg-palette-green-300",
    },
    {
      color: "dark-green",
      interactive: true,
      class: "hover:bg-palette-green-500",
    },
    {
      color: "yellow",
      interactive: true,
      class: "hover:bg-tag-surface-hover-yellow",
    },
    {
      color: "light-yellow",
      interactive: true,
      class: "hover:bg-palette-yellow-300",
    },
    {
      color: "dark-yellow",
      interactive: true,
      class: "hover:bg-palette-yellow-500",
    },
    {
      color: "orange",
      interactive: true,
      class: "hover:bg-tag-surface-hover-orange",
    },
    {
      color: "light-orange",
      interactive: true,
      class: "hover:bg-palette-orange-300",
    },
    {
      color: "dark-orange",
      interactive: true,
      class: "hover:bg-palette-orange-500",
    },
    {
      color: "brown",
      interactive: true,
      class: "hover:bg-tag-surface-hover-brown",
    },
    {
      color: "light-brown",
      interactive: true,
      class: "hover:bg-palette-brown-300",
    },
    {
      color: "dark-brown",
      interactive: true,
      class: "hover:bg-palette-brown-500",
    },
    {
      color: "grey",
      interactive: true,
      class: "hover:bg-tag-surface-hover-grey",
    },
    {
      color: "dark-grey",
      interactive: true,
      class: "hover:bg-palette-neutral-600",
    },
    {
      color: "light-grey",
      interactive: true,
      class: "hover:bg-tag-surface-hover-light-grey",
    },
    {
      color: "red",
      selected: true,
      class: "text-surface-default bg-palette-red-700 hover:bg-palette-red-700",
    },
    {
      color: "light-red",
      selected: true,
      class: "text-surface-default bg-palette-red-600 hover:bg-palette-red-600",
    },
    {
      color: "dark-red",
      selected: true,
      class: "text-surface-default bg-palette-red-800 hover:bg-palette-red-800",
    },
    {
      color: "rose",
      selected: true,
      class:
        "text-surface-default bg-tag-surface-selected-rose hover:bg-tag-surface-selected-rose",
    },
    {
      color: "light-rose",
      selected: true,
      class:
        "text-surface-default bg-palette-rose-600 hover:bg-palette-rose-600",
    },
    {
      color: "dark-rose",
      selected: true,
      class:
        "text-surface-default bg-palette-rose-800 hover:bg-palette-rose-800",
    },
    {
      color: "purple",
      selected: true,
      class:
        "text-surface-default bg-tag-surface-selected-purple hover:bg-tag-surface-selected-purple",
    },
    {
      color: "light-purple",
      selected: true,
      class:
        "text-surface-default bg-palette-purple-600 hover:bg-palette-purple-600",
    },
    {
      color: "dark-purple",
      selected: true,
      class:
        "text-surface-default bg-palette-purple-800 hover:bg-palette-purple-800",
    },
    {
      color: "blue",
      selected: true,
      class:
        "text-surface-default bg-tag-surface-selected-blue hover:bg-tag-surface-selected-blue",
    },
    {
      color: "light-blue",
      selected: true,
      class:
        "text-surface-default bg-palette-blue-600 hover:bg-palette-blue-600",
    },
    {
      color: "dark-blue",
      selected: true,
      class:
        "text-surface-default bg-palette-blue-800 hover:bg-palette-blue-800",
    },
    {
      color: "teal",
      selected: true,
      class:
        "text-surface-default bg-tag-surface-selected-teal hover:bg-tag-surface-selected-teal",
    },
    {
      color: "light-teal",
      selected: true,
      class:
        "text-surface-default bg-palette-teal-600 hover:bg-palette-teal-600",
    },
    {
      color: "dark-teal",
      selected: true,
      class:
        "text-surface-default bg-palette-teal-800 hover:bg-palette-teal-800",
    },
    {
      color: "green",
      selected: true,
      class:
        "text-surface-default bg-palette-green-700 hover:bg-palette-green-700",
    },
    {
      color: "light-green",
      selected: true,
      class:
        "text-surface-default bg-palette-green-600 hover:bg-palette-green-600",
    },
    {
      color: "dark-green",
      selected: true,
      class:
        "text-surface-default bg-palette-green-800 hover:bg-palette-green-800",
    },
    {
      color: "yellow",
      selected: true,
      class:
        "text-surface-default bg-tag-surface-selected-yellow hover:bg-tag-surface-selected-yellow",
    },
    {
      color: "light-yellow",
      selected: true,
      class:
        "text-surface-default bg-palette-yellow-600 hover:bg-palette-yellow-600",
    },
    {
      color: "dark-yellow",
      selected: true,
      class:
        "text-surface-default bg-palette-yellow-800 hover:bg-palette-yellow-800",
    },
    {
      color: "orange",
      selected: true,
      class:
        "text-surface-default bg-tag-surface-selected-orange hover:bg-tag-surface-selected-orange",
    },
    {
      color: "light-orange",
      selected: true,
      class:
        "text-surface-default bg-palette-orange-600 hover:bg-palette-orange-600",
    },
    {
      color: "dark-orange",
      selected: true,
      class:
        "text-surface-default bg-palette-orange-800 hover:bg-palette-orange-800",
    },
    {
      color: "brown",
      selected: true,
      class:
        "text-surface-default bg-tag-surface-selected-brown hover:bg-tag-surface-selected-brown",
    },
    {
      color: "light-brown",
      selected: true,
      class:
        "text-surface-default bg-palette-brown-600 hover:bg-palette-brown-600",
    },
    {
      color: "dark-brown",
      selected: true,
      class:
        "text-surface-default bg-palette-brown-800 hover:bg-palette-brown-800",
    },
    {
      color: "grey",
      selected: true,
      class:
        "text-surface-default bg-tag-surface-selected-grey hover:bg-tag-surface-selected-grey",
    },
    {
      color: "dark-grey",
      selected: true,
      class:
        "text-surface-default bg-palette-neutral-800 hover:bg-palette-neutral-800",
    },
    {
      color: "light-grey",
      selected: true,
      class:
        "text-surface-default bg-tag-surface-selected-light-grey hover:bg-tag-surface-selected-light-grey",
    },
  ],
});

const TagClose = tv({
  base: [
    "group/close rounded-full text-current shrink-0",
    "duration-300 transition-all ease-expressive-out",
  ],
  variants: {
    selected: {
      true: "pointer-events-auto opacity-100 scale-100 translate-x-0",
      false: "",
    },
    showRemoveIcon: {
      true: "relative",
      false:
        "absolute end-1 pointer-events-none opacity-0 scale-50 translate-x-1",
    },
    hasRemoveIcon: {
      true: [
        "group-hover/tag:pointer-events-auto group-hover/tag:opacity-100 group-hover/tag:scale-100 group-hover/tag:translate-x-0",
        // "group-hover/tag:ml-1 group-hover/tag:-mr-0.5 ",
      ],
      false: "",
    },
    color: {
      red: "hover:text-palette-red-300 hover:bg-palette-red-1000",
      "light-red": "hover:text-palette-red-200 hover:bg-palette-red-900",
      "dark-red": "hover:text-palette-red-400 hover:bg-palette-red-1000",
      rose: "hover:text-tag-surface-rose hover:bg-tag-text-rose",
      "light-rose": "hover:text-palette-rose-200 hover:bg-palette-rose-900",
      "dark-rose": "hover:text-palette-rose-400 hover:bg-palette-rose-1000",
      purple: "hover:text-tag-surface-purple hover:bg-tag-text-purple",
      "light-purple":
        "hover:text-palette-purple-200 hover:bg-palette-purple-900",
      "dark-purple":
        "hover:text-palette-purple-400 hover:bg-palette-purple-1000",
      blue: "hover:text-tag-surface-blue hover:bg-tag-text-blue",
      "light-blue": "hover:text-palette-blue-200 hover:bg-palette-blue-900",
      "dark-blue": "hover:text-palette-blue-400 hover:bg-palette-blue-1000",
      teal: "hover:text-tag-surface-teal hover:bg-tag-text-teal",
      "light-teal": "hover:text-palette-teal-200 hover:bg-palette-teal-900",
      "dark-teal": "hover:text-palette-teal-400 hover:bg-palette-teal-1000",
      green: "hover:text-palette-green-300 hover:bg-palette-green-1000",
      "light-green": "hover:text-palette-green-200 hover:bg-palette-green-900",
      "dark-green": "hover:text-palette-green-400 hover:bg-palette-green-1000",
      yellow: "hover:text-tag-surface-yellow hover:bg-tag-text-yellow",
      "light-yellow":
        "hover:text-palette-yellow-200 hover:bg-palette-yellow-900",
      "dark-yellow":
        "hover:text-palette-yellow-400 hover:bg-palette-yellow-1000",
      "light-grey":
        "hover:text-tag-surface-light-grey hover:bg-tag-text-light-grey",
      grey: "hover:text-tag-surface-grey hover:bg-tag-text-grey",
      "dark-grey":
        "hover:text-palette-neutral-400 hover:bg-palette-neutral-1000",
      brown: "hover:text-tag-surface-brown hover:bg-tag-text-brown",
      "light-brown": "hover:text-palette-brown-200 hover:bg-palette-brown-900",
      "dark-brown": "hover:text-palette-brown-400 hover:bg-palette-brown-1000",
      orange: "hover:text-tag-surface-orange hover:bg-tag-text-orange",
      "light-orange":
        "hover:text-palette-orange-200 hover:bg-palette-orange-900",
      "dark-orange":
        "hover:text-palette-orange-400 hover:bg-palette-orange-1000",
    },
  },
});

export interface TagProps
  extends Omit<VariantProps<typeof TagVariant>, "color"> {
  color?: VariantProps<typeof TagVariant>["color"] | string;
  text?: React.ReactNode | string;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  selected?: boolean;
  showRemoveIcon?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  removeIcon?: boolean;
  handleRemoveClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  /** Typography utilities on the label span (`[data-text]`). */
  textClassName?: string;
  animation?: boolean;
}

const Tag = ({
  text,
  leadingIcon,
  trailingIcon,
  color,
  selected,
  removeIcon,
  showRemoveIcon = false,
  onClick,
  handleRemoveClick,
  className,
  textClassName,
  interactive = true,
  animation = true,
  ...props
}: TagProps) => {
  const container = React.useRef<HTMLDivElement | null>(null);
  const [selectedState, setSelectedState] = useState(selected);
  useOnClickOutside(container, () => setSelectedState(false));

  const style = useMemo(
    () => ({
      "--bg-selected": adaptColorBrightness(color, -20),
      "--bg-hover": adaptColorBrightness(color, 10),
      "--bg-default": adaptColorBrightness(color, 17),
      // '--text-selected': "#FFF",
      "--text-default": adaptColorBrightness(color, -50),
    }),
    [color],
  );

  const isCustomColor = useMemo(() => {
    return !TAG_COLOR_KEY_SET.has(color ?? "");
  }, [color]);

  const containerVariant = TagVariant({
    color: color as VariantProps<typeof TagVariant>["color"],
    interactive,
    selected,
    selectedState,
    hasRemoveIcon: removeIcon,
    className: cn(
      text != null && "min-w-10",
      isCustomColor &&
        "bg-[var(--bg-default)] text-[var(--text-default)] ring-[var(--bg-hover)]",
      isCustomColor && interactive && "hover:bg-[var(--bg-hover)]",
      isCustomColor &&
        selected &&
        "bg-[var(--bg-selected)] text-surface-default",
    ),
  });
  const closeVariant = TagClose({
    selected: selectedState,
    color: (TAG_COLOR_KEY_SET.has(color ?? "")
      ? color
      : "grey") as VariantProps<typeof TagClose>["color"],
    hasRemoveIcon: Boolean(removeIcon),
    showRemoveIcon: Boolean(showRemoveIcon),
    className: cn(
      isCustomColor &&
        interactive &&
        "hover:bg-[var(--text-default)] hover:text-[var(--bg-default)]",
      isCustomColor &&
        selected &&
        "bg-[var(--bg-selected)] text-surface-default",
    ),
  });

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: <explanation>
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      ref={container}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={cn(containerVariant, className)}
      style={style as unknown as React.CSSProperties}
      onClick={(e) => {
        if (!interactive) return;
        onClick?.(e as unknown as React.MouseEvent<HTMLButtonElement>);
        setSelectedState((e) => !e);
      }}
      {...props}
    >
      {leadingIcon && <Icon name={leadingIcon} className="h-[1.125em]" />}
      {text && (
        <span
          data-text
          className={cn(
            textClassName,
            interactive && removeIcon && "group-hover/tag:w-[calc(100%-12px)]",
            interactive && removeIcon && selectedState && "w-[calc(100%-12px)]",
          )}
        >
          {text}
        </span>
      )}
      {trailingIcon && <Icon name={trailingIcon} className="h-[1.125em]" />}
      {removeIcon && (
        // biome-ignore lint/a11y/useSemanticElements: this element can be nested inside a button
        // biome-ignore lint/a11y/useKeyWithClickEvents: this interface is built for mouse input
        <span
          role="button"
          className={closeVariant}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveClick?.(
              e as unknown as React.MouseEvent<HTMLButtonElement>,
            );
          }}
          tabIndex={selected ? 0 : -1}
        >
          <Icon name="x-md" className="text-current -m-0.5 size-[1.25em]" />
        </span>
      )}
    </div>
  );
};

export default memo(Tag);
