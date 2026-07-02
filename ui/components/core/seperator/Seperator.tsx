import * as React from "react";
import { tv, VariantProps } from "tailwind-variants";
import * as RadixSeparator from "@radix-ui/react-separator";
import { cn } from "../../../util/classNameConstructor";

const SeperatorStyles = tv({
  slots: {
    wrapper: "",
    seperator: "",
  },
  variants: {
    orientation: {
      horizontal: {
        wrapper: "flex w-full flex-col justify-center",
        seperator: "my-1 h-px w-full",
      },
      vertical: {
        wrapper: "flex h-full justify-center",
        seperator: "mx-1 h-full w-px",
      },
    },
    style: {
      dark: {
        seperator: "bg-border-default",
      },
      light: {
        seperator: "bg-border-subdued",
      },
    },
  },
});

type SeperatorProps = VariantProps<typeof SeperatorStyles> & {
  orientation?: "horizontal" | "vertical";
  style?: "dark" | "light";
  className?: string;
};
const Seperator = ({
  orientation = "horizontal",
  style = "light",
  className,
  ...props
}: SeperatorProps) => {
  const { wrapper, seperator } = SeperatorStyles({ orientation, style });

  return (
    <div
      className={cn(wrapper(), className)}
      {...props}
    >
      <RadixSeparator.Root className={seperator()}></RadixSeparator.Root>
    </div>
  );
};

Seperator.displayName = "Seperator";
export default Seperator;
