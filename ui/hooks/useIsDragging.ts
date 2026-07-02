/** @format */

import { useState, useEffect } from "react";

export function useIsDragging<T extends Element>(ref?: React.RefObject<T>) {
  const [isDragging, setIsDragging] = useState(false);
  const element = ref?.current || document;

  const dragLeave = () => setIsDragging(() => (false))
  const dragOver = () => setIsDragging(() => (true))
  useEffect(() => {
    element.addEventListener("dragover", dragOver);
    element.addEventListener("dragleave", dragLeave);
    return () => {
      element.removeEventListener("dragover", dragOver);
      element.removeEventListener("dragleave", dragLeave);
    };
  }, []);
  return isDragging;
}
