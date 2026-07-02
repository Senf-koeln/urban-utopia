/** @format */

import { useEffect, useRef } from "react";

export function usePrevious<T>(value: T) {
  const ref = useRef<[T, T]>([value, value]);
  useEffect(() => {
    ref.current = [ref.current[1], value];
  }, [value]);
  return ref.current[0];
}
