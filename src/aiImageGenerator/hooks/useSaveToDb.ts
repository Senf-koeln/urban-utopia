import { useVerifyFiles } from "@ui/hooks/useVerifyFiles";
import {
  generateBase62Id,
  getMediaObjects,
  insertGeneration,
} from "@/lib/dataAccess";
import { PERSISTENT_STORAGE, SESSION_STORAGE } from "../constants/storageKeys";
import type { Generation } from "../types";

interface ImageResult {
  img: string | null;
  error: string | null;
}

interface SaveRequest {
  imageBase64?: string;
  prompt: string;
  model?: string;
  retryCount?: number;
}

const useSaveToDb = () => {
  const { checkFileUpload } = useVerifyFiles();

  // Function to convert base64 string to Blob
  const base64ToBlob = (base64: string, mime: string) => {
    try {
      // Handle both full data URLs and raw base64
      const base64Data = base64.includes("data:")
        ? base64.split(",")[1]
        : base64;
      const byteString = atob(base64Data);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      return new Blob([ab], { type: mime });
    } catch (error) {
      console.error("Error converting base64 to blob:", error);
      return new Blob([], { type: mime }); // Return empty blob on error
    }
  };

  // Function to fetch image from URL and convert to blob
  const urlToBlob = async (url: string, mime: string): Promise<Blob> => {
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
      return new Blob([], { type: mime }); // Return empty blob on error
    }
  };

  // Updated handleFileDrop function
  const handleConvertImages = async (files: string[]) => {
    console.log("fileees", files);

    // Define the names for the files based on their order
    const fileNames = [
      "original",
      "rendering1",
      "rendering2",
      "rendering3",
      "rendering4",
      "rendering5",
    ];

    const convertedFiles = await Promise.all(
      files
        .filter((file) => file && typeof file === "string")
        .map(async (file: string, index: number) => {
          const mime = "image/jpeg"; // MIME type for JPG
          let blob: Blob;

          // Check if it's a URL or base64 data
          if (file.startsWith("http://") || file.startsWith("https://")) {
            // It's a URL, fetch and convert to blob
            blob = await urlToBlob(file, mime);
          } else {
            // It's base64 data, convert directly
            blob = base64ToBlob(file, mime);
          }

          // Use the index to get the corresponding name, or default to a numbered name if index exceeds predefined names
          const name = fileNames[index] || `image${index}`;
          return new File([blob], `${name}.jpg`, { type: mime });
        }),
    );

    return convertedFiles;
  };

  const handleFileDrop = async (files: File[], id: string) => {
    const filePath = `utopia/requests/${id}`;

    const fileList = checkFileUpload({ files });

    console.log(fileList);

    const imageObjectsPromises = fileList.map((file) => {
      return getMediaObjects({
        fileList: [file],
        setPath: () => filePath,
      });
    });

    // Wait for all getMediaObjects promises to resolve
    const imageObjects = await Promise.all(imageObjectsPromises);

    // Flatten the array if getMediaObjects returns an array for each file
    const flattenedImageObjects = imageObjects.flat();

    return flattenedImageObjects;
  };

  const handleSaveToDb = async (
    request: SaveRequest,
    results: ImageResult,
    generationId?: string,
  ) => {
    // Prepare base64files array with proper null checks
    const base64files = [
      request.imageBase64
        ? `data:image/jpeg;base64,${request.imageBase64}`
        : null,
      results?.img || null,
    ].filter((file): file is string => !!file);

    if (base64files.length === 0) {
      const error = "No valid files to save";
      console.error("useSaveToDb:", error);
      throw new Error(error);
    }

    const id = generationId || generateBase62Id();
    console.log("useSaveToDb: Using generationId:", id);

    let convertedFiles: File[] = [];
    try {
      convertedFiles = await handleConvertImages(base64files);
    } catch (error) {
      console.error("useSaveToDb: Error converting images:", error);
      throw error;
    }

    if (convertedFiles.length === 0) {
      const error = "No files were converted successfully";
      console.error("useSaveToDb:", error);
      throw new Error(error);
    }

    try {
      console.log("useSaveToDb: Converted files count:", convertedFiles.length);

      const imageObjects = await handleFileDrop(convertedFiles, id);
      console.log("useSaveToDb: Saved image objects:", imageObjects);

      // Get identifiers from storage
      const userId = localStorage.getItem(PERSISTENT_STORAGE.USER_ID);
      const organizationId = localStorage.getItem(
        PERSISTENT_STORAGE.ORGANIZATION_ID,
      );
      const projectId = localStorage.getItem(PERSISTENT_STORAGE.PROJECT_ID);
      const sessionId = sessionStorage.getItem(SESSION_STORAGE.SESSION_ID);

      console.log("useSaveToDb: Retrieved identifiers:", {
        userId: userId ? "✓" : "✗",
        organizationId: organizationId ? "✓" : "✗",
        projectId: projectId ? "✓" : "✗",
        sessionId: sessionId ? "✓" : "✗",
      });

      if (!userId || !organizationId || !projectId || !sessionId) {
        const error = `Missing required identifiers: userId=${!!userId}, organizationId=${!!organizationId}, projectId=${!!projectId}, sessionId=${!!sessionId}`;
        console.error("useSaveToDb: " + error);
        throw new Error(error);
      }

      // Use the generated image (second in array) or first if only one
      const generatedImage = imageObjects[1] || imageObjects[0];

      const generationData: Generation = {
        image: {
          url: generatedImage.url,
          name: generatedImage.name || `generation-${id}`,
          uploadedAt: new Date().toISOString(),
        },
        prompt: request.prompt,
        model:
          (request.model as "gemini" | "flux" | "stable-diffusion") || "gemini",
        sessionId,
        userId,
        projectId,
        organizationId,
        createdAt: new Date().toISOString(),
        status: "complete",
        retryCount: request.retryCount || 0,
      };

      console.log("useSaveToDb: About to save generation to Firestore");

      await insertGeneration(
        organizationId,
        projectId,
        sessionId,
        id,
        generationData,
      );
      console.log("useSaveToDb: Successfully saved to Firestore");

      const result = {
        ...generationData,
        id: id,
      };
      console.log("useSaveToDb: Returning result with id:", id);
      return result;
    } catch (error) {
      console.error("useSaveToDb: Error in try block:", error);
      console.error(
        "useSaveToDb: Error message:",
        error instanceof Error ? error.message : String(error),
      );
      throw error; // Propagate error to caller
    }
  };

  return { handleSaveToDb, handleFileDrop };
};

export default useSaveToDb;
