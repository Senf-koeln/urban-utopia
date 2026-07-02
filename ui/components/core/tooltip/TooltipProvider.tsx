import * as RadixTooltip from "@radix-ui/react-tooltip";
import type React from "react";
import {
  type KeyboardEventHandler,
  type MouseEventHandler,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { throttle as throttleFunction } from "@shared";
import { useIsTruncated } from "@shared/utils/hooks";
import { Z_INDEX } from "../../../util/zIndexLayers";
import Tooltip, { type TooltipProps } from "./Tooltip";

// Low-tech global tooltip state
const tooltipState = {
  open: new Set<string>(),
  lastActive: 0,
  add: (id: string) => {
    tooltipState.open.add(id);
    tooltipState.lastActive = Date.now();
  },
  remove: (id: string) => {
    tooltipState.open.delete(id);
    tooltipState.lastActive = Date.now();
  },
  reset: () => {
    tooltipState.lastActive = 0;
  },
  getDelay: (defaultDelay: number) => {
    return tooltipState.open.size > 0 ||
      Date.now() - tooltipState.lastActive < 500
      ? 0
      : defaultDelay;
  },
};

export interface TooltipProviderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onClick"> {
  children: React.ReactNode;
  critical?: boolean;
  throttle?: number;
  noTooltip?: boolean;
  suppressTooltip?: boolean; // renders the containers children without the tooltip
  disabled?: boolean;
  open?: boolean;
  closeOnClick?: boolean;
  primaryContent?: string | React.ReactNode;
  delay?: number;
  onClick?: MouseEventHandler<HTMLElement> | "openTooltip";
  hasArrow?: boolean;
  resetStyles?: boolean;
  ref?: React.RefObject<HTMLElement | null>;
  enableTruncated?: boolean;
  tooltipProps?: Omit<Partial<TooltipProps>, "onClick">;
  as?: React.ElementType;
}

const TooltipProvider = ({
  children,
  critical,
  noTooltip,
  enableTruncated,
  suppressTooltip,
  disabled,
  primaryContent,
  onClick,
  className,
  open: externalOpen = false,
  closeOnClick = true,
  delay = 700,
  throttle = 200,
  ref: fallbackRef,
  tooltipProps,
  as: Component = "div",
  ...props
}: TooltipProviderProps &
  Omit<RadixTooltip.TooltipContentProps, "onClick">) => {
  const [triggerTooltipShake, setTriggerTooltipShake] = useState(false);
  const [open, setOpen] = useState(externalOpen);
  const [hovered, setHovered] = useState(false);
  const mouseLeaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouseEnterTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCloseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // const innerRef = useRef<HTMLElement>(null);
  const { ref, isTruncated } = useIsTruncated<HTMLElement | null>(
    fallbackRef,
    !!enableTruncated,
  );

  const tooltipId = useId();

  useEffect(() => {
    setOpen(externalOpen);
  }, [externalOpen]);

  // Track tooltip state in global object
  useEffect(() => {
    if (open) {
      tooltipState.add(tooltipId);
    } else {
      tooltipState.remove(tooltipId);
    }
  }, [open, tooltipId]);

  // Cleanup on unmount
  useEffect(() => {
    window.addEventListener("click", tooltipState.reset);

    return () => {
      tooltipState.remove(tooltipId);
      window.removeEventListener("click", tooltipState.reset);
    };
  }, [tooltipId]);

  // Throttled click handler for better performance
  const throttledClick = useMemo(() => {
    if (typeof onClick === "function") {
      return throttleFunction(onClick, throttle);
    }
    return undefined;
  }, [onClick, throttle]);

  const handleTap = (event: React.MouseEvent<HTMLElement>) => {
    if (!("ontouchstart" in window || navigator.maxTouchPoints > 0)) return;
    if (disabled || typeof onClick === "function") event.stopPropagation();
    setOpen(!!primaryContent);
    if (disabled) setTriggerTooltipShake(!triggerTooltipShake);
    if (!disabled && throttledClick) {
      throttledClick(event);
    }
    return true;
  };

  const handleClick: MouseEventHandler<HTMLElement> = (event) => {
    if (mouseEnterTimeout.current) clearTimeout(mouseEnterTimeout.current);
    if (handleTap(event)) return;
    if (disabled || onClick === "openTooltip") {
      if (!open) setOpen(!!primaryContent);
      if (disabled) {
        setTriggerTooltipShake(!triggerTooltipShake);
      }
      if (autoCloseTimeout.current) clearTimeout(autoCloseTimeout.current);
      autoCloseTimeout.current = setTimeout(() => {
        if (!hovered) setOpen(false);
      }, 1500);

      event.stopPropagation();
      return;
    }
    if (closeOnClick) setOpen(false);

    if (throttledClick) throttledClick(event);
  };

  const handleKeyDown: KeyboardEventHandler<HTMLElement> = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      if (disabled) {
        event.preventDefault();
        handleClick(event as unknown as React.MouseEvent<HTMLElement>);
      }
    }
  };

  const tooltipStyle = useMemo(() => ({ zIndex: Z_INDEX.TOOLTIP }), []);
  const stableTooltipProps = useMemo(() => tooltipProps ?? {}, [tooltipProps]);
  const hoveredRef = useRef(hovered);
  hoveredRef.current = hovered;
  const onPointerDownOutside = useCallback(() => {
    if (!hoveredRef.current) setOpen(false);
  }, []);

  const onMouseEnter = () => {
    setHovered(true);
    if (mouseLeaveTimeout.current) clearTimeout(mouseLeaveTimeout.current);
    if (disabled) return;
    mouseEnterTimeout.current = setTimeout(() => {
      setOpen(!!primaryContent);
    }, tooltipState.getDelay(delay));
  };

  const onMouseLeave = () => {
    setHovered(false);
    if (mouseEnterTimeout.current) clearTimeout(mouseEnterTimeout.current);
    setOpen(false);
  };

  if (noTooltip || (enableTruncated && !isTruncated)) {
    return (
      <Component
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={className}
        ref={ref}
      >
        {children}
      </Component>
    );
  }

  return (
    <RadixTooltip.Provider aria-label="tooltip">
      <Tooltip
        {...stableTooltipProps}
        style={tooltipStyle}
        hasArrow={props.hasArrow ?? true}
        critical={critical}
        primaryContent={
          primaryContent as React.JSX.Element | string | null | undefined
        }
        shake={triggerTooltipShake}
        onPointerDownOutside={onPointerDownOutside}
        open={suppressTooltip ? false : open}
        // Keep tooltips above all surfaces by always portaling to body.
        portalContainer={undefined}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Component
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className={className}
          ref={ref}
          {...props}
        >
          {children}
        </Component>
      </Tooltip>
    </RadixTooltip.Provider>
  );
};

export default TooltipProvider;
