/** @format */

import React from "react";
import { tv } from "tailwind-variants";
import { cn } from "../../../util/classNameConstructor";

const DividerVariant = tv({
  base: "bg-border-subdued rounded",
  slots: {
    wrapper: "flex items-center gap-3",
    text: "body-sm text-text-subdued whitespace-nowrap text-center",
  },
  variants: {
    orientation: {
      horizontal: {
        base: "h-[1px] w-full",
        wrapper: "my-2 w-full",
      },
      vertical: {
        base: "h-full min-h-[1rem] w-[1px]",
        wrapper: "mx-2 flex-col",
      },
    },
  },
});

interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  vertical?: boolean;
  text?: string;
  classNames?: {
    wrapper?: string;
    divider?: string;
    text?: string;
  };
}
const Divider = ({
  className,
  classNames,
  vertical,
  text,
  children,
}: DividerProps) => {
  const {
    wrapper,
    base,
    text: textClass,
  } = DividerVariant({
    orientation: vertical ? "vertical" : "horizontal",
  });
  return (
    <div className={cn(wrapper(), className, classNames?.wrapper)}>
      {children || text ? (
        <>
          <div className={cn(base(), classNames?.divider)} />
          <span className={cn(textClass(), classNames?.text)}>
            {children || text}
          </span>
          <div className={cn(base(), classNames?.divider)} />
        </>
      ) : (
        <div className={cn(base(), classNames?.divider)} />
      )}
    </div>
  );
};

export default Divider;
