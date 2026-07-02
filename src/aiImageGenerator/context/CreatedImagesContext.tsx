import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

export interface CreatedImage {
  id: string;
  image: string;
  timestamp: number;
  prompt?: string;
  projectId?: string;
}

interface CreatedImagesContextType {
  images: CreatedImage[];
  addImage: (image: string, prompt?: string, projectId?: string) => void;
  deleteImage: (id: string) => void;
  clearImages: () => void;
}

const CreatedImagesContext = createContext<
  CreatedImagesContextType | undefined
>(undefined);

export const CreatedImagesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [images, setImages] = useState<CreatedImage[]>([]);

  // Load image metadata from localStorage on mount
  useEffect(() => {
    const savedMetadata = localStorage.getItem("createdImagesMetadata");
    if (savedMetadata) {
      try {
        setImages(JSON.parse(savedMetadata));
      } catch (error) {
        console.error(
          "Error loading created images metadata from localStorage:",
          error,
        );
      }
    }
  }, []);

  // Save only metadata to localStorage (not the full image data)
  useEffect(() => {
    // Store only metadata without the base64 image data to avoid quota issues
    const metadata = images.map(({ image, ...rest }) => rest);
    try {
      localStorage.setItem("createdImagesMetadata", JSON.stringify(metadata));
    } catch (error) {
      console.error(
        "Error saving created images metadata to localStorage:",
        error,
      );
    }
  }, [images]);

  const addImage = (image: string, prompt?: string, projectId?: string) => {
    const newImage: CreatedImage = {
      id: `img-${Date.now()}-${Math.random()}`,
      image,
      timestamp: Date.now(),
      prompt,
      projectId,
    };
    setImages((prev) => [newImage, ...prev]);
  };

  const deleteImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const clearImages = () => {
    setImages([]);
  };

  return (
    <CreatedImagesContext.Provider
      value={{ images, addImage, deleteImage, clearImages }}
    >
      {children}
    </CreatedImagesContext.Provider>
  );
};

export const useCreatedImages = () => {
  const context = useContext(CreatedImagesContext);
  if (!context) {
    throw new Error(
      "useCreatedImages must be used within CreatedImagesProvider",
    );
  }
  return context;
};
