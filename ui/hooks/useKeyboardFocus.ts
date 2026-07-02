import React from "react";

const useKeyboardFocus = () => {
  const [focusVisible, setFocusVisible] = React.useState(false);

  const handleKeyDown = React.useCallback((event) => {
    if (event.key === "Tab") {
      setFocusVisible(true);
    }
  }, []);

  const handleKeyUp = React.useCallback((event) => {
    if (event.key === "Tab") {
      setFocusVisible(false);
    }
  }, []);

  const attachListeners = React.useCallback(
    (element) => {
      if (element) {
        element.addEventListener("keydown", handleKeyDown);
        element.addEventListener("keyup", handleKeyUp);
      }
    },
    [handleKeyDown, handleKeyUp]
  );

  const removeListeners = React.useCallback(
    (element) => {
      if (element) {
        element.removeEventListener("keydown", handleKeyDown);
        element.removeEventListener("keyup", handleKeyUp);
      }
    },
    [handleKeyDown, handleKeyUp]
  );

  return { focusVisible, attachListeners, removeListeners };
};

export default useKeyboardFocus;
