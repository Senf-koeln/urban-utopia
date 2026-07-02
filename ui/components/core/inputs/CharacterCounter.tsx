import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Shake from "../../atoms/shake/Shake";
import { cn } from "../../../util/classNameConstructor";

interface CharacterCounterProps {
  value: string;
  minLength?: number;
  maxLength?: number;
  inputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>; // Support both input and textarea
  className?: string;
}

const CharacterCounter: React.FC<CharacterCounterProps> = ({
  value,
  minLength,
  maxLength,
  inputRef,
  className,
}) => {
  const { t } = useTranslation();
  const [triggerMaxLengthShake, setTriggerMaxLengthShake] = useState(false);

  const handler = useCallback(
    (e: Event) => {
      if (
        maxLength !== undefined &&
        String((e.target as HTMLInputElement | HTMLTextAreaElement)?.value)
          .length >= maxLength
      ) {
        setTriggerMaxLengthShake((e) => !e);
      }
    },
    [maxLength],
  );

  useEffect(() => {
    inputRef?.current?.addEventListener("keyup", handler);
    return () => {
      inputRef?.current?.removeEventListener("keyup", handler);
    };
  }, [inputRef, handler]);

  useEffect(() => {
    if (inputRef?.current) return;
    handler({ target: { value } } as unknown as Event);
  }, [inputRef, value, handler]);

  const isCritical = maxLength !== undefined && value.length >= maxLength;

  const counterText = useMemo(() => {
    if (
      (!minLength && maxLength) ||
      (minLength && value.length >= minLength && maxLength)
    ) {
      return `${value.length} / ${maxLength} ${t("global:characters")}`;
    }
    if (minLength && value.length < minLength) {
      `${value.length} / ${minLength} ${t("global:characters")}`;
    }
    if (value.length < (minLength ?? 0)) {
      return `${t("global:min").toLocaleLowerCase()}. ${minLength} ${t(
        "global:characters",
      )}`;
    }
    return null;
  }, [maxLength, minLength, t, value.length]);
  return (
    <Shake
      trigger={triggerMaxLengthShake}
      tag="span"
      className={cn(
        "text-xs",
        isCritical ? "text-text-critical" : "text-text-subdued",
        className,
      )}
    >
      {counterText}
    </Shake>
  );
};

export default CharacterCounter;
