import { type MouseEventHandler, memo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { cn } from "../../../util/classNameConstructor";
import Button from "../../core/button/Button";

interface HandleContainerProps {
  swipe: boolean;
  onClick?:
    | (MouseEventHandler<HTMLDivElement> & (false | (() => void)))
    | undefined;
}
interface ModalHandleProps {
  swipe: boolean;
  onClose: (() => void) | false;
  closeModal: () => void;
  color?: string;
  size?: string;
  modalHandle?: boolean;
  closeButtonVariant?: "basic" | "outline" | "shapeless" | "white";
}

const HandleContainer = styled.div<HandleContainerProps>`
  display: flex;
  position: absolute;
  inset: 0;
  padding: 10px;
  min-height: 35px;
  width: 100%;
  box-sizing: border-box;
  touch-action: none;
  z-index: 999;
  justify-content: ${({ swipe }) => (swipe ? "center" : "end")};
  cursor: ${({ swipe }) => (swipe ? "pointer" : "default")};
  pointer-events: ${({ swipe }) => (swipe ? "auto" : "none")};
  button {
    pointer-events: auto;
    margin-left: auto;
  }
`;
const Handle = styled.div`
  height: 5px;
  width: 50px;
  border-radius: 20px;
  background-color: ${({ color }) => color || null};
  backdrop-filter: blur(3px) saturate(1.1) brightness(0.9) hue-rotate(-4deg);
`;
const ModalHandle = ({
  swipe,
  color,
  onClose,
  closeModal,
  size,
  modalHandle,
  closeButtonVariant,
}: ModalHandleProps) => {
  const { t } = useTranslation();
  return modalHandle !== false ? (
    <HandleContainer
      onClick={() => {
        if (!swipe) return;
        if (onClose) onClose();
        closeModal();
      }}
      swipe={swipe}
    >
      {swipe && size !== "fullscreen" ? (
        <Handle color={color} />
      ) : onClose !== false ? (
        <div
          className={cn(
            "fixed top-3",
            document.dir === "rtl" ? "left-3" : "right-3",
          )}
        >
          <Button
            size="md"
            variant={closeButtonVariant || "basic"}
            leadingIcon="x-md"
            onClick={() => {
              if (onClose) onClose();
              closeModal();
            }}
            tooltipLabel={t("global:close")}
          />
        </div>
      ) : null}
    </HandleContainer>
  ) : null;
};
export default memo(ModalHandle);
