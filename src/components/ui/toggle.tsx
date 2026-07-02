import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface ToggleProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, label, ...props }, ref) => {
    const id = props.id || `toggle-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex items-center gap-3">
        {label && (
          <label htmlFor={id} className="text-sm font-medium cursor-pointer">
            {label}
          </label>
        )}
        <input
          type="checkbox"
          id={id}
          ref={ref}
          className={cn(
            "relative h-6 w-11 appearance-none rounded-full bg-gray-300 transition-colors checked:bg-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 cursor-pointer",
            "before:content-[''] before:absolute before:h-5 before:w-5 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-transform checked:before:translate-x-5",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
Toggle.displayName = "Toggle";

export { Toggle };
