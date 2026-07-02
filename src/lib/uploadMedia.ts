import { getDownloadURL, ref, storage, uploadBytes } from "./storage";

export type UploadedMediaObject = {
  url: string;
  name: string;
  path: string;
  size: number;
  width?: number;
  height?: number;
};

const readImageDimensions = (file: File): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () =>
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });

export async function getMediaObjects({
  fileList,
  setPath,
  setName,
}: {
  fileList: File[];
  setPath: (file: File) => string;
  setName?: (file: File) => string;
}): Promise<UploadedMediaObject[]> {
  const results: UploadedMediaObject[] = [];

  for (const file of fileList) {
    const basePath = setPath(file);
    const stem =
      (setName?.(file) ?? file.name.replace(/\.[^.]+$/, "")) || "file";
    const extension = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf("."))
      : "";
    const uploadName = `${stem}-${Date.now()}${extension}`;
    const objectPath = `${basePath}/${uploadName}`;
    const storageRef = ref(storage, objectPath);

    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    let width: number | undefined;
    let height: number | undefined;
    if (file.type.startsWith("image/")) {
      try {
        const dimensions = await readImageDimensions(file);
        width = dimensions.width;
        height = dimensions.height;
      } catch {
        /* optional metadata */
      }
    }

    results.push({
      url,
      name: uploadName,
      path: basePath,
      size: file.size,
      width,
      height,
    });
  }

  return results;
}
