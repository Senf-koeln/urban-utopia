import React, { memo, type SVGProps } from "react";
import { cn } from "../../../util/classNameConstructor";
import type { IconName } from "./names";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName | Element;
  label?: string;
  className?: string;
}

const Icon = ({ name, label, className, ...props }: IconProps) => {
  const loading = name === "loading";
  const icon = loading ? "spinner" : name;

  if (React.isValidElement(icon)) {
    const element = icon as React.ReactElement<{ className?: string }>;
    return React.cloneElement(element, {
      ...props,
      className: cn(element.props.className, className),
    });
  }
  if (typeof icon !== "string") return null;

  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      name={String(label || name)}
      {...props}
      className={cn(
        "pointer-events-none",
        className,
        loading ? "animate-revolve" : "",
      )}
      role="presentation"
      aria-hidden="true"
    >
      <title>{label || name || ""}</title>
      <use href={`#${icon}`} />
    </svg>
  );
};

Icon.displayName = "Icon";
export default memo(Icon);
