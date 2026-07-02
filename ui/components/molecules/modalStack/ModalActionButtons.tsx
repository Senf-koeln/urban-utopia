import { cn } from "../../../util/classNameConstructor";
import Button from "../../core/button/Button";
import type { ModalOptions } from "./ModalStack.types";

const ModalActionButtons = ({ ...options }: ModalOptions) => {
  const {
    cancelText,
    cancelVariant,
    submitText,
    submitDisabled,
    submitLoading,
    critical,
    onClose,
    closeModal,
    onSubmit,
    description,
    modalPayload,
    subscriptions,
  } = options || {};
  if (!cancelText && !submitText) return null;

  const handleClose = () => {
    if (onClose === false) return;
    if (onClose) onClose();
    if (closeModal) closeModal();
  };
  const handleSubmit = () => {
    subscriptions?.current?.onSubmit?.(modalPayload);
    const submitResult = onSubmit ? onSubmit(modalPayload) : undefined;
    if (!closeModal) return;
    if (submitResult instanceof Promise) {
      submitResult.then(closeModal);
    } else {
      closeModal();
    }
  };

  return (
    <div
      className={cn(
        "p-5 flex-wrap w-full gap-2 grid grid-cols-[repeat(auto-fit,_minmax(0,_1fr))]",
        description && "pt-0",
      )}
    >
      {cancelText && (
        <Button
          size="xl"
          id={`${options?.id}-cancelButton`}
          variant={cancelVariant || "basic"}
          width="max"
          onClick={handleClose}
          text={cancelText}
        />
      )}
      {submitText && (
        <Button
          size="xl"
          id={`${options?.id}-submitButton`}
          variant="primary"
          width="max"
          critical={critical}
          onClick={handleSubmit}
          disabled={!!submitDisabled}
          text={submitText}
          loading={submitLoading}
        />
      )}
    </div>
  );
};

export default ModalActionButtons;
