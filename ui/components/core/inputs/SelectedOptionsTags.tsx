"use client";

import { Fragment, memo } from "react";
import { Tag } from "../../..";
import { cn } from "../../../util/classNameConstructor";
import type { TagProps } from "../../atoms/tag/Tag";

export interface SelectedOptionTagItem {
  label: string | undefined;
  value: string;
  color?: TagProps["color"];
}

export interface SelectedOptionsTagsProps {
  items: SelectedOptionTagItem[];
  className?: string;
  type?: "tag" | "plain";
  /** Called with the full tag item when a tag is removed. */
  onRemove?: (item: SelectedOptionTagItem) => void;
}

/**
 * Shared component for rendering selected options as tags with comma separators.
 * Used by Combobox and Select when multiSelect displays selected values in the trigger.
 */
const SelectedOptionsTags = memo<SelectedOptionsTagsProps>(
  ({ items, className, type = "plain", onRemove }) => {
    if (!items.length) return null;

    return items.map((item, i, arr) => (
      <Fragment key={item.value}>
        <Tag
          text={item.label}
          color={item.color || "grey"}
          interactive={false}
          showRemoveIcon={type === "tag"}
          removeIcon={type === "tag"}
          handleRemoveClick={() => onRemove?.(item)}
          className={cn(
            type === "plain" &&
              "whitespace-nowrap truncate text-base font-bold p-0 pe-1 -me-1 last:me-1 !bg-transparent -my-1",
            type === "tag" && "mr-1 -my-0.5 [&>span]:truncate",
            className,
          )}
        />
        {i < arr.length - 1 && type === "plain" && (
          <span className="text-base font-bold text-text-default leading-none">
            {"\u2060,\u2005"}
          </span>
        )}
      </Fragment>
    ));
  },
);

SelectedOptionsTags.displayName = "SelectedOptionsTags";

export default SelectedOptionsTags;
