import { useEffect, useRef, useState } from "react";

export const useIsTruncated = <T extends HTMLElement | null>(
  ref?: React.RefObject<T>,
  enabled = true,
) => {
  const fallbackRef = useRef<T>(null);
  const containerRef = ref || fallbackRef;
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const checkTruncation = () => {
      if (containerRef.current) {
        const truncated =
          containerRef.current.scrollHeight >
          containerRef.current.clientHeight + 5;
        setIsTruncated((prev) => (prev !== truncated ? truncated : prev));
      }
    };

    checkTruncation();
    const timeoutId = setTimeout(checkTruncation, 10);

    const resizeObserver = new ResizeObserver(() => {
      checkTruncation();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [containerRef, enabled]);

  return { isTruncated, ref: containerRef };
};
