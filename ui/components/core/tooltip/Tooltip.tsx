import * as RadixTooltip from "@radix-ui/react-tooltip";
import { animated, useTransition } from "@react-spring/web";
import type * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";
import Shake from "../../atoms/shake/Shake";
import Icon from "../icon/Icon";
import type { IconName } from "../icon/names";

const TooltipStyles = tv({
  slots: {
    baseStyles:
      "flex max-w-xs items-center justify-center gap-1.5 rounded-xl px-3 py-2 shadow-lg relative",
    textWrapperStyles: " body-md flex flex-1 flex-col",
    primaryContentStyles: "body-md text-text-on-primary-depressed flex gap-1.5",
    secondaryContentStyles: " body-md text-text-placeholder",
    arrowStyles: "",
  },
  variants: {
    fixedWidth: {
      true: {
        baseStyles: "w-60",
      },
    },
    description: {
      true: {
        baseStyles: "w-60",
      },
    },
    critical: {
      true: {
        baseStyles: "bg-border-critical-default",
        arrowStyles: "fill-border-critical-default",
      },
      false: {
        baseStyles: "bg-palette-neutral-1000",
        arrowStyles: "fill-palette-neutral-1000",
      },
    },
  },
  defaultVariants: {
    critical: false,
    fixedWidth: false,
  },
});

export interface TooltipProps
  extends VariantProps<typeof TooltipStyles>,
    RadixTooltip.TooltipProps,
    Omit<
      RadixTooltip.TooltipContentProps,
      "content" | "onMouseEnter" | "onMouseLeave"
    > {
  primaryContent?: React.JSX.Element | string | null;
  secondaryContent?: React.JSX.Element | string | null;
  icon?: IconName | React.JSX.Element;
  hasArrow?: boolean;
  resetStyles?: boolean;
  shake?: boolean;
  portalContainer?: HTMLElement | null;
  onMouseEnter: React.MouseEventHandler<HTMLButtonElement>;
  onMouseLeave: React.MouseEventHandler<HTMLButtonElement>;
}

const Tooltip = ({
  defaultOpen,
  delayDuration,
  disableHoverableContent,
  onOpenChange,
  open,
  primaryContent,
  icon,
  children,
  className,
  secondaryContent,
  shake,
  onMouseEnter,
  onMouseLeave,
  fixedWidth = false,
  sideOffset = 5,
  critical = false,
  hasArrow = false,
  resetStyles = false,
  portalContainer = document.body,
  ...props
}: TooltipProps) => {
  const {
    baseStyles,
    textWrapperStyles,
    primaryContentStyles,
    secondaryContentStyles,
    arrowStyles,
  } = TooltipStyles({
    fixedWidth,
    critical,
    description: !!secondaryContent,
  });

  const transitions = useTransition(open, {
    from: { opacity: 0, scale: 0.9 },
    enter: { opacity: 1, scale: 1 },
    leave: { opacity: 0, scale: 0.9 },
    config: { tension: 500, friction: 30 },
  });

  return (
    <RadixTooltip.Root
      defaultOpen={true}
      delayDuration={delayDuration}
      disableHoverableContent={disableHoverableContent}
      onOpenChange={onOpenChange}
      open={true}
    >
      <RadixTooltip.Trigger
        asChild
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        aria-describedby={children?.[0]?.id}
      >
        {children}
      </RadixTooltip.Trigger>
      {transitions((styles, item) =>
        item ? (
          <RadixTooltip.Portal container={portalContainer}>
            <RadixTooltip.Content
              collisionPadding={10}
              sideOffset={sideOffset}
              {...props}
              id="tooltip-content"
              className="max-w-[90vw]"
              aria-live="polite"
            >
              <animated.div
                style={{
                  ...styles,
                  transformOrigin:
                    "var(--radix-tooltip-content-transform-origin)",
                }}
                className={resetStyles ? className : baseStyles({ className })}
              >
                <div className={textWrapperStyles()}>
                  <Shake
                    trigger={shake}
                    className={resetStyles ? "" : primaryContentStyles()}
                  >
                    {(critical || icon) && (
                      <Icon
                        name={
                          critical ? "alert-circle-fill" : (icon as IconName)
                        }
                        color="white"
                        className="shrink-0"
                      />
                    )}
                    {primaryContent}
                  </Shake>
                  <span className={secondaryContentStyles()}>
                    {secondaryContent}
                  </span>
                </div>
                {hasArrow && <RadixTooltip.Arrow className={arrowStyles()} />}
              </animated.div>
            </RadixTooltip.Content>
          </RadixTooltip.Portal>
        ) : null,
      )}
    </RadixTooltip.Root>
  );
};
Tooltip.displayName = "Tooltip";
export default Tooltip;
