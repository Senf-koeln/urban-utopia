import { useCallback, useEffect, useState } from "react";
import { generateBase62Id, updateUtopiaLastRequest } from "@/lib/dataAccess";
import { geminiRequest } from "../../lib/geminiRequest";
import { useUser } from "../context/userContext";
import type { ImageResult } from "../types";
import { compressImageIfNeeded, resizeImageTo1024 } from "../utils/imageUtils";
import useSaveToDb from "./useSaveToDb";

interface InpaintResponse {
  image: string;
  status?: string;
  logs?: string;
}

const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement("a");
  link.href = dataUrl.includes("data:")
    ? dataUrl
    : `data:image/png;base64,${dataUrl}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Replace INITIAL_RESPONSE_DATA constant with single image initial state
const INITIAL_RESPONSE_STATE: ImageResult = { img: null, error: null };

const useGeminiGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState<ImageResult>(
    INITIAL_RESPONSE_STATE,
  );
  const handleSetResponseData = () => setResponseData(INITIAL_RESPONSE_STATE);
  const { handleSaveToDb } = useSaveToDb();
  const { setRemainingCredits } = useUser();

  useEffect(() => {
    if (!sessionStorage.getItem("id"))
      sessionStorage.setItem("id", generateBase62Id());
  }, []);

  const fetchImage = async (
    prompt: string,
    imageBase64: string,
    model: string,
    retryCount: number,
    strength: number,
  ) => {
    setLoading(true);
    let lastRequestUpdated = false;
    const adjustedPrompt = prompt;

    // if (prompt.length > 400) {
    //   const response = await geminiRequest({
    //     body: `Please summarize the following prompt to a maximum of 400 characters: ${prompt}

    //       Rules:
    //       - Its supposed to be an instruction for an image editing tool, so it should be in the form of an instruction
    //       – If there were people in the initial primpt please preserve that part as we rather want lively images
    //       – Always start with add or transform so that its clear that the current image should be edited and still be recognizable as the same image
    //       `,
    //     assistantId: "default",
    //     lang: "en",
    //   });

    //   adjustedPrompt = (response as string) || prompt;
    // }

    try {
      // Update lastRequest status with retry mechanism
      for (let i = 0; i < 3; i++) {
        try {
          await updateUtopiaLastRequest({
            generating: true,
          });
          lastRequestUpdated = true;
          break;
        } catch (error) {
          if (i === 2) {
            console.error(
              "Failed to update lastRequest status after 3 attempts:",
              error,
            );
            // Continue execution even if this fails
          } else {
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        }
      }

      if (!imageBase64) {
        throw new Error("No image data provided");
      }

      let returnedData: string | null = null;
      try {
        console.log("adjustedPrompt", adjustedPrompt);

        // Convert base64 image to data URL for Replicate
        const inputImageUrl =
          typeof imageBase64 === "string" && imageBase64.includes("data:")
            ? imageBase64
            : `data:image/jpeg;base64,${imageBase64}`;

        // Comment out the original replicateRequest call
        // returnedData = await replicateRequest({
        //   prompt: `Transform the image based on the prompt while preserving the core structure and recognizable elements.
        //
        // Key Requirements:
        // - Maintain the original buildings and overall scene composition
        // - Apply changes naturally with proper lighting and perspective
        // - Keep modifications proportional and realistic
        // - Preserve the neighborhood's character and structure
        //
        //
        // This is the prompt:
        //
        //         ${adjustedPrompt}, Photorealistic style with balanced lighting and colors.
        //
        //
        //     `,
        //   input_image: inputImageUrl,
        //   output_format: "jpg"
        // });

        // Use Gemini Flash instead
        returnedData = await geminiFlashImageGeneration({
          prompt: `Add these things to the image, make it nice and balanced like an archticetural presentation: ${adjustedPrompt}`,
          image: inputImageUrl,
        });

        console.log(
          "returnedData",
          returnedData ? typeof returnedData : "null",
          returnedData && typeof returnedData === "string"
            ? returnedData.substring(0, 100)
            : "",
        );
      } catch (error) {
        setLoading(false);
        console.error("Error calling Replicate API:", error);
        throw new Error("Failed to generate image. Please try again.");
      }

      // Create image result based on what we received
      let imageResult: ImageResult;

      if (returnedData) {
        // Replicate returns a direct URL to the image
        if (
          typeof returnedData === "string" &&
          (returnedData.startsWith("http") || returnedData.startsWith("data:"))
        ) {
          imageResult = { img: returnedData, error: null };
        } else {
          console.error(
            "Unexpected response format from Replicate:",
            typeof returnedData,
          );
          imageResult = { img: null, error: "Unexpected response format" };
        }
      } else {
        imageResult = { img: null, error: "No data returned" };
      }

      console.log("imageResult", imageResult);
      setLoading(false);

      // Save result if image was generated successfully
      if (imageResult.img) {
        // Save to DB immediately and get the generationId from Firestore document
        try {
          console.log(
            "useGeminiGenerator: About to save generation to Firestore",
          );
          const savedGeneration = await handleSaveToDb(
            { prompt, imageBase64, model, retryCount: retryCount || 0 },
            imageResult,
          );

          const generationId = savedGeneration?.id;
          console.log(
            "useGeminiGenerator: Got generationId from Firestore:",
            generationId,
          );

          if (generationId) {
            // Set response data with ID from Firestore
            setResponseData({
              ...imageResult,
              generationId: generationId,
            });
            console.log(
              "useGeminiGenerator: Set responseData with generationId from Firestore",
            );
            setRemainingCredits((prev) => prev - 1);
          } else {
            console.error(
              "useGeminiGenerator: No generationId returned from save",
            );
            setResponseData(imageResult);
          }
        } catch (error) {
          console.error(
            "useGeminiGenerator: Error saving generation to Firestore:",
            error,
          );
          console.error(
            "Error details:",
            error instanceof Error ? error.message : String(error),
          );
          // Still show the image even if save failed
          setResponseData(imageResult);
        }
      } else {
        console.log("imageResult", imageResult);
        setResponseData(imageResult);
        console.error("No valid image was generated");
      }
    } catch (error) {
      console.error("Error in fetchImage:", error);
      setResponseData({
        img: null,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      if (lastRequestUpdated) {
        try {
          await updateUtopiaLastRequest({
            generating: false,
          });
        } catch (error) {
          console.error("Failed to update lastRequest status to false:", error);
        }
      }
    }
  };

  return {
    loading,
    responseData,
    fetchImage,
    setLoading,
  };
};

// Gemini Flash image generation function
async function geminiFlashImageGeneration({
  prompt,
  image,
}: {
  prompt: string;
  image: string;
}): Promise<string> {
  try {
    console.log("Input image type:", typeof image);
    console.log("Input image starts with:", image.substring(0, 50));

    // Compress image if it's too large
    const compressedImage = await compressImageIfNeeded(image, 1500000); // 1.5MB limit

    // Convert base64 image to the format expected by Gemini
    // Extract just the base64 data, removing the data URL prefix
    let imageData: string;
    if (compressedImage.includes("data:")) {
      imageData = compressedImage.split(",")[1];
      console.log("Extracted base64 data length:", imageData.length);
    } else {
      imageData = compressedImage;
      console.log("Using image as-is, length:", imageData.length);
    }

    const images = [
      {
        data: imageData,
        mimeType: "image/jpeg",
      },
    ];

    console.log("Sending to Gemini with prompt:", prompt.substring(0, 100));
    console.log("Image data length:", imageData.length);

    let response: string | string[] | Record<string, any> | null | undefined =
      null;
    try {
      response = await geminiRequest({
        body: prompt,
        assistantId: "manipulateImageGeneral",
        lang: "en",
        images: images,
      });
    } catch (error) {
      console.log(
        "manipulateImageGeneral failed, trying default assistant:",
        error,
      );
      // Fallback to default assistant
      response = await geminiRequest({
        body: prompt,
        assistantId: "default",
        lang: "en",
        images: images,
      });
    }

    if (!response) {
      throw new Error("No response from Gemini Flash API");
    }

    console.log("gemini response type:", typeof response);
    if (typeof response === "string") {
      console.log("gemini response length:", response.length);
      console.log("gemini response starts with:", response.substring(0, 100));
    }

    // Handle different response types
    if (typeof response === "string") {
      // If response is already a base64 string, return it as a data URL
      if (response.startsWith("data:")) {
        return response;
      }
      return `data:image/png;base64,${response}`;
    }

    if (response instanceof ArrayBuffer) {
      // Convert the response buffer to base64
      const base64String = btoa(
        new Uint8Array(response).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          "",
        ),
      );
      return `data:image/png;base64,${base64String}`;
    }

    throw new Error(`Unexpected response type: ${typeof response}`);
  } catch (error) {
    console.error("Error in Gemini Flash image generation:", error);
    throw error;
  }
}

export default useGeminiGenerator;
