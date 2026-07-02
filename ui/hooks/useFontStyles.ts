import { useEffect, useRef, useState } from "react";

export const useFontStyles = (
  ref?: React.RefObject<HTMLElement>,
  dependencies: any[] = [],
) => {
  const [lineHeight, setLineHeight] = useState(0);
  const [fontSize, setFontSize] = useState(0);
  const fallbackRef = useRef<HTMLElement>(null);
  const containerRef = ref || fallbackRef;

  useEffect(() => {
    if (containerRef.current?.parentElement) {
      const computedStyle = window.getComputedStyle(containerRef.current);
      const lineHeightValue = Number.parseFloat(computedStyle.lineHeight);

      setFontSize(Number.parseFloat(computedStyle.fontSize));
      if (!Number.isNaN(lineHeightValue)) {
        setLineHeight(lineHeightValue);
      } else {
        // If line-height is 'normal', it's typically ~1.2 * fontSize
        setLineHeight(fontSize * 1.2);
      }
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  }, dependencies);

  return [{ lineHeight, fontSize }, containerRef] as const;
};
