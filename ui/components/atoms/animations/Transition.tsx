import {
  type AnimationConfig,
  animated,
  config as defaultConfig,
  type UseTransitionProps,
  useTransition,
} from "@react-spring/web";
import type { FC, HTMLAttributes } from "react";
import React, { useMemo } from "react";
import { cn } from "../../../util/classNameConstructor";

interface TransitionProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "onRest" | "onDestroy"
> {
  show?: boolean;
  transitionActive?: boolean;
  from?: React.CSSProperties;
  leave?: React.CSSProperties;
  enter?: React.CSSProperties;
  easing?: keyof typeof defaultConfig;
  duration?: number;
  style?: React.CSSProperties;
  config?: Partial<AnimationConfig>;
  // Add specific props from UseTransitionProps that we need
  onStart?: UseTransitionProps["onStart"];
  onRest?: UseTransitionProps["onRest"];
  onDestroyed?: UseTransitionProps["onDestroyed"];
}

const Transition: FC<TransitionProps> = React.memo(
  ({
    children,
    show,
    transitionActive,
    from,
    leave,
    enter,
    config,
    style,
    easing = "gentle",
    onClick,
    onMouseEnter,
    onMouseLeave,
    className,
    onStart,
    onRest,
    onDestroyed,
    ...props
  }) => {
    const transitionConfig = useMemo(
      () => ({
        from: { opacity: 0, ...from },
        leave: { opacity: 0, ...leave },
        enter: { opacity: 1, ...enter },
        config: config || defaultConfig[easing],
        onStart,
        onRest,
        onDestroyed,
      }),
      [from, leave, enter, config, easing, onStart, onRest, onDestroyed],
    );

    const transition = useTransition(show, transitionConfig);

    const combinedStyle = useMemo(() => ({ ...style }), [style]);

    if (transitionActive === false) return show ? <>{children}</> : null;

    return transition(
      (transitionStyle, show) =>
        show && (
          <animated.div
            className={cn("absolute w-fit h-full", className)}
            style={{ ...combinedStyle, ...transitionStyle }}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            {...props}
          >
            {children}
          </animated.div>
        ),
    );
  },
);

Transition.displayName = "Transition";

export default Transition;
