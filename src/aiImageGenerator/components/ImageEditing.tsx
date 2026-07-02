import type React from "react";
import { useIsMobile } from "@ui";
import Button from "@ui/components/core/button/Button";
import { cn } from "@ui/util/classNameConstructor";
import TileLibrary from "../TileLibrary";
import styles from "./ImageEditing.module.css";

interface ImageEditingProps {
  initialImage: string | null;
  image: string | null;
  loading: boolean;
  responseData: { img: string | null } | null;
  handleRegenerate: (e: React.MouseEvent) => void;
  setImage: (url: string) => void;
  uploadedImgRef: React.RefObject<HTMLImageElement>;
}

const ImageEditing: React.FC<ImageEditingProps> = ({
  initialImage,
  image,
  loading,
  responseData,
  handleRegenerate,
  setImage,
  uploadedImgRef,
}) => {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        "z-10 flex items-center justify-center gap-0 w-screen absolute",
        isMobile
          ? "h-[45vh] top-0 left-0 px-2 pt-12 pb-2"
          : "h-screen left-[210px]",
      )}
    >
      <div
        className={cn(
          styles.wrapper,
          loading && styles.cardWrapper,
          "relative select-none rounded-[22px] min-h-min w-fit h-fit [--card-height:auto] [--card-width:auto]",
          isMobile
            ? "max-h-full max-w-full"
            : "max-h-[calc(100%-170px)] max-w-[calc(100vw-470px)]",
        )}
      >
        {(image || initialImage) && (
          <img
            ref={uploadedImgRef}
            src={image || initialImage}
            alt="Generated"
            className={cn(
              "rounded-2xl object-contain h-full w-full",
              isMobile
                ? "max-h-[calc(45vh-56px)] max-w-[calc(100vw-16px)]"
                : "max-h-[calc(100vh-170px)] max-w-[calc(100vw-470px)]",
            )}
          />
        )}

        {responseData?.img && (
          <Button
            variant="outline"
            size="md"
            className="absolute right-3 top-3 z-20 body-md font-bold bg-white"
            leadingIcon="reload"
            loading={loading}
            onClick={handleRegenerate}
          />
        )}
      </div>
    </div>
  );
};

export default ImageEditing;
