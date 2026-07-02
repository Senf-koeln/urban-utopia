/**
 * Consolidated image processing utility functions
 */

/**
 * Resizes an image to 1024px width while maintaining aspect ratio
 */
export const resizeImageTo1024 = (imageSrc: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let newWidth: number;
      let newHeight: number;
      const aspectRatio = img.width / img.height;

      newWidth = 1024;
      newHeight = newWidth / aspectRatio;

      const canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      const resizedBase64String = canvas.toDataURL("image/jpeg", 0.65);
      resolve(resizedBase64String);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for resizing"));
    };

    img.src = imageSrc;
  });
};

/**
 * Aggressively compress image if it exceeds size limit
 */
export const compressImageIfNeeded = (
  base64String: string,
  maxSizeBytes = 3000000, // 3MB default
): Promise<string> => {
  return new Promise((resolve) => {
    const sizeInBytes = base64String.length * 0.75; // Approximate byte size

    if (sizeInBytes <= maxSizeBytes) {
      resolve(base64String);
      return;
    }

    // Image is too large, compress it
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(base64String); // Fall back to original
        return;
      }

      ctx.drawImage(img, 0, 0);

      // Try increasingly lower qualities until we fit the size limit
      for (let quality = 0.4; quality >= 0.08; quality -= 0.02) {
        const compressed = canvas.toDataURL("image/jpeg", quality);
        const compressedSize = compressed.length * 0.75;
        if (compressedSize <= maxSizeBytes) {
          resolve(compressed);
          return;
        }
      }

      // Last resort: use lowest quality
      resolve(canvas.toDataURL("image/jpeg", 0.2));
    };

    img.onerror = () => {
      resolve(base64String); // Fall back to original
    };

    img.src = base64String;
  });
};

/**
 * Applies brightness and contrast adjustments to canvas
 */
export const applyStyleTransfer = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): string => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  let totalBrightness = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    totalBrightness += brightness;
  }

  const averageBrightness = totalBrightness / (canvas.width * canvas.height);

  if (averageBrightness > 120) {
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const contrastLevel = 20;
    const contrastFactor =
      (259 * (contrastLevel + 255)) / (255 * (259 - contrastLevel));

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = contrastFactor * (pixels[i] - 128) + 128;
      pixels[i + 1] = contrastFactor * (pixels[i + 1] - 128) + 128;
      pixels[i + 2] = contrastFactor * (pixels[i + 2] - 128) + 128;
    }

    ctx.putImageData(imageData, 0, 0);
  } else if (averageBrightness < 80) {
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  return canvas.toDataURL("image/jpeg", 0.7);
};

/**
 * Process an image through the pipeline: style transfer and resizing
 */
export const processImage = async (originalImage: string): Promise<string> => {
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = originalImage;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    ctx.drawImage(img, 0, 0, img.width, img.height);
    const styledImage = applyStyleTransfer(canvas, ctx);

    return await resizeImageTo1024(styledImage);
  } catch (error) {
    console.error("Error in image processing pipeline:", error);
    throw error;
  }
};

/**
 * Convert image URL or blob to base64 string
 */
export const imageToBase64 = async (imageSource: string): Promise<string> => {
  if (imageSource.startsWith("data:")) {
    return imageSource.split(",")[1];
  }

  try {
    const response = await fetch(imageSource);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw error;
  }
};
