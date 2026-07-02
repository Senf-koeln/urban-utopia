/**
 * Firebase utility functions for common operations
 */

import {
  getMediaObjects,
  patchDocumentAtCollectionPath,
  setDocumentAtCollectionPath,
  updateUtopiaLastRequest,
} from "@/lib/dataAccess";

/**
 * Update the last request status in Firestore (used to show generation state)
 */
export const updateLastRequestStatus = async (
  generating: boolean,
): Promise<void> => {
  try {
    await updateUtopiaLastRequest({ generating });
  } catch (error) {
    console.error("Failed to update lastRequest status:", error);
    throw error;
  }
};

/**
 * Save image metadata to Firestore
 */
export const saveImageToFirestore = async (
  collectionPath: string,
  docId: string,
  data: Record<string, any>,
): Promise<void> => {
  try {
    await setDocumentAtCollectionPath(collectionPath, docId, data);
  } catch (error) {
    console.error("Failed to save image to Firestore:", error);
    throw error;
  }
};

/**
 * Update existing document in Firestore
 */
export const updateFirestoreDoc = async (
  collectionPath: string,
  docId: string,
  data: Record<string, any>,
): Promise<void> => {
  try {
    await patchDocumentAtCollectionPath(collectionPath, docId, data);
  } catch (error) {
    console.error("Failed to update Firestore document:", error);
    throw error;
  }
};

/**
 * Convert base64 string to Blob
 */
export const base64ToBlob = (base64: string, mimeType = "image/jpeg"): Blob => {
  try {
    const base64Data = base64.includes("data:") ? base64.split(",")[1] : base64;
    const byteString = atob(base64Data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeType });
  } catch (error) {
    console.error("Error converting base64 to blob:", error);
    return new Blob([], { type: mimeType });
  }
};

/**
 * Fetch image from URL and convert to Blob
 */
const isRemoteImageUrl = (url: string): boolean =>
  /^https?:\/\//i.test(url);

/** Upload session original to Storage; pass through existing https URLs. */
export const uploadSessionOriginalImageUrl = async (
  imageUrl: string,
  sessionId: string,
  fileName: string,
): Promise<string> => {
  if (isRemoteImageUrl(imageUrl)) {
    return imageUrl;
  }

  const mimeMatch = imageUrl.match(/^data:([^;]+);/);
  const mime = mimeMatch?.[1] || "image/jpeg";
  const blob = base64ToBlob(imageUrl, mime);
  const file = new File([blob], fileName, { type: mime });
  const [result] = await getMediaObjects({
    fileList: [file],
    setPath: () => `utopia/sessions/${sessionId}`,
    setName: (f) => f.name.replace(/\.[^.]+$/, "") || "original",
  });

  if (!result?.url) {
    throw new Error("Failed to upload session original image");
  }

  return result.url;
};

export const uploadSessionOriginalFile = async (
  file: File,
  sessionId: string,
): Promise<string> => {
  const [result] = await getMediaObjects({
    fileList: [file],
    setPath: () => `utopia/sessions/${sessionId}`,
    setName: (f) => f.name.replace(/\.[^.]+$/, "") || "original",
  });

  if (!result?.url) {
    throw new Error("Failed to upload session original image");
  }

  return result.url;
};

export const urlToBlob = async (
  url: string,
  mimeType = "image/jpeg",
): Promise<Blob> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`,
      );
    }
    return await response.blob();
  } catch (error) {
    console.error("Error fetching image from URL:", error);
    return new Blob([], { type: mimeType });
  }
};
