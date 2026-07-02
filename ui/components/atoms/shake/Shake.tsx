import { type WithAnimated, animated, useSpring } from "@react-spring/web";
import React, { useState } from "react";

const ShakeWrapper = ({
  trigger,
  className,
  children,
  tag = "div",
}: React.HTMLAttributes<HTMLDivElement> & {
  trigger?: any;
  tag?: keyof WithAnimated;
}) => {
  const [loaded, setLoaded] = useState(false);

  const [style, api] = useSpring(() => ({
    transform: "translate3d(0, 0, 0) rotate(0)",
    config: {
      tension: 2000,
      friction: 10,
    },
  }));

  React.useEffect(() => {
    if (!loaded) return setLoaded(true);

    const [x, y, r] = [Math.random() * 2 + 3, Math.random(), Math.random()];

    api.start({
      transform: `translate3d(${x}px, ${y}px, 0) rotate(${r}deg)`,
      immediate: true,
    });

    const timeout = setTimeout(() => {
      api.start({
        transform: "translate3d(0, 0, 0) rotate(0)",
      });
    }, 0);

    return () => clearTimeout(timeout);
  }, [trigger]);

  const Tag = animated[tag] || "div";

  return (
    <Tag style={style} className={className}>
      {children}
    </Tag>
  );
};

export default ShakeWrapper;
