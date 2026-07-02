import { useState } from "react";

interface UseVerifyFilesProps {
  mimeTypes?: string[];
  maxSize?: number;
}

export const useVerifyFiles = ({
  mimeTypes = ["image/", "video/"],
  maxSize = 20000000,
}: UseVerifyFilesProps = {}) => {
  const [invalidType, setInvalidType] = useState(false);
  const [invalidSize, setInvalidSize] = useState(false);

  const validType = (type: string) =>
    mimeTypes.some((mimeType) => type.startsWith(mimeType));

  const validSize = (size: number) => size < maxSize;

  const checkFileUpload = ({ files }: { files?: FileList | File[] }) => {
    const validFiles = [] as File[];

    [...(files || [])].forEach((file) => {
      if (validType(file.type)) {
        if (validSize(file.size)) validFiles.push(file);
        else setInvalidSize(true);
      } else setInvalidType(true);
    });

    setTimeout(
      () => {
        setInvalidSize(false);
        setInvalidType(false);
      },
      validFiles.length ? 0 : 2000,
    );

    return validFiles;
  };

  return { invalidType, invalidSize, checkFileUpload };
};
