import React, { FC } from "react";
import { ModalOptions } from "./ModalStack.types";
import { useModals } from "./ModalProvider";
import Button, { ButtonProps } from "../../core/button/Button";

interface ModalButtonProps extends Omit<ButtonProps, "children"> {
  options: ModalOptions;
  children?: JSX.Element;
  button?: React.Node;
}

const ModalButton: FC<ModalButtonProps> = ({
  children,
  options,
  button,
  replace,
  ...props
}) => {
  const { openModal, replaceModal } = useModals();
  const CustomButton = button || Button;
  return (
    <CustomButton
      onClick={() =>
        replace
          ? replaceModal(children || null, options)
          : openModal(children || null, options)
      }
      id={`${options?.id}-openButton`}
      {...props}
    />
  );
};

export default ModalButton;
