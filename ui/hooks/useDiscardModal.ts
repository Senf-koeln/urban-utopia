import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useModals } from "../components/molecules/modalStack/ModalProvider";
import type { ModalOptions } from "../components/molecules/modalStack/ModalStack.types";
import { useIsMobile } from "./customDeviceDetect";

interface DiscardModalOptions extends ModalOptions {
  type?: "closeAll" | "onlyCloseDiscardModal";
}

export function useDiscardModal() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { openModal, closeModal, closeAllModals } = useModals();

  const displayDiscardModal = useCallback(
    (options: DiscardModalOptions = {}) => {
      const {
        title = t("util:discard", { val: t("global:changes") }),
        description = t("global:discardDescription"),
        submitText = t("global:discard"),
        onSubmit,
        type = "closeAll",
      } = options;

      return new Promise<void>((resolve) => {
        openModal(null, {
          title,
          description,
          swipe: !!isMobile,
          size: isMobile ? "full" : "md",
          cancelText: t("global:cancel"),
          submitText,
          critical: true,
          zIndex: 99999999999999,
          id: "discardModal",
          onSubmit: async () => {
            if (onSubmit) {
              await onSubmit();
            }
            if (type === "closeAll") {
              closeAllModals();
            } else {
              closeModal({ id: "discardModal" });
            }
            resolve();
          },
        });
      });
    },
    [openModal, closeModal, closeAllModals, t, isMobile],
  );

  return { displayDiscardModal };
}
