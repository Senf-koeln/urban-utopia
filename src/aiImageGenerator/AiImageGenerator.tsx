import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Transition, useIsMobile, useModals } from "@ui";
import Button from "@ui/components/core/button/Button";
import { Input } from "@ui/components/core/inputs/Input";
import { cn } from "@ui/util/classNameConstructor";
import { getSession, listGenerations, updateGeneration } from "@/lib/dataAccess";
import Header from "./components/Header";
import ImageEditing from "./components/ImageEditing";
import ObjectSelectionSection from "./components/ObjectSelectionSection";
import Toolbar from "./components/Toolbar";
import { PERSISTENT_STORAGE, SESSION_STORAGE } from "./constants/storageKeys";
import { useCreatedImages } from "./context/CreatedImagesContext";
import { ids } from "./helpers/ids";
import useGeminiGenerator from "./hooks/useGeminiGenerator";
import { useModels } from "./hooks/useModels";
import TileLibrary from "./TileLibrary";
import type { SelectedObject } from "./types";

const toGenerationTimestampMs = (value: unknown): number => {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as { toMillis: () => number }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }

  const parsed = new Date(String(value ?? "")).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

interface AiImageGeneratorProps {
  index?: number;
  setIndex?: React.Dispatch<React.SetStateAction<number>>;
  setFinishedImage?: (image: string | null) => void;
}

const TitleModal: React.FC<{
  image: string;
  selectedObjects: SelectedObject[];
  projectId: string;
  generationId: string;
  addImage: (image: string, title?: string, projectId?: string) => void;
  closeModal: () => void;
  handleRestart: () => void;
  setShowAnimation: (show: boolean) => void;
}> = ({
  image,
  selectedObjects,
  projectId,
  generationId,
  addImage,
  closeModal,
  handleRestart,
  setShowAnimation,
}) => {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (image) {
      try {
        setLoading(true);
        setShowAnimation(true);

        const prompt = selectedObjects.map((obj) => obj.prompt).join(" and ");
        const finalTitle = title || prompt || undefined;

        console.log(
          "TitleModal: handleSave called with generationId:",
          generationId,
        );

        // Save to CreatedImagesContext (legacy)
        addImage(image, finalTitle, projectId);

        // Mark generation as finished in Firestore
        const organizationId = localStorage.getItem(
          PERSISTENT_STORAGE.ORGANIZATION_ID,
        );
        const sessionId = sessionStorage.getItem(SESSION_STORAGE.SESSION_ID);

        console.log("TitleModal: Firestore identifiers:", {
          organizationId,
          projectId,
          sessionId,
          generationId,
        });

        if (organizationId && projectId && sessionId && generationId) {
          await updateGeneration(
            organizationId,
            projectId,
            sessionId,
            generationId,
            {
              finished: true,
              title: finalTitle,
            },
          );
          console.log(
            "TitleModal: Successfully marked generation as finished:",
            generationId,
          );
        } else {
          console.warn("TitleModal: Missing identifiers for Firestore update", {
            organizationId,
            projectId,
            sessionId,
            generationId,
          });
        }

        setTimeout(() => {
          handleRestart();
          closeModal();
        }, 3500);
      } catch (error) {
        console.error("Error saving finished image:", error);
        alert(t("aiImageGenerator.errors.failedSaveImage"));
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex w-full flex-col gap-4 px-5 pb-5">
      <div>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titel eingeben..."
          autoFocus
          type="textarea"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button text="Abbrechen" onClick={closeModal} size="lg" />
        <Button
          text="Speichern"
          variant="primary"
          onClick={handleSave}
          disabled={loading}
          loading={loading}
          size="lg"
        />
      </div>
    </div>
  );
};

const AnimationPortal: React.FC<{ showAnimation: boolean }> = ({
  showAnimation,
}) => {
  if (!showAnimation) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 w-screen h-screen z-[999999999999] pointer-events-none">
      <DotLottieReact
        src="https://lottie.host/288e3775-1985-41f8-9a42-ea47b56cee2f/0uWTDjkDJ6.lottie"
        loop
        autoplay
        className="w-full h-full scale-150"
      />
    </div>,
    document.body,
  );
};

const AiImageGenerator: React.FC<AiImageGeneratorProps> = ({
  index = 0,
  setIndex,
  setFinishedImage,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { projectId } = useParams<{ projectId: string }>();
  const isMobile = useIsMobile();
  const { openModal, closeModal } = useModals();
  const [search, setSearch] = useState("");
  const [selectedObjects, setSelectedObjects] = useState<SelectedObject[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [lastUsedObjects, setLastUsedObjects] = useState<SelectedObject[]>([]);
  const [lastInputImage, setLastInputImage] = useState<string | null>(null);
  const [finishedImage, setLocalFinishedImage] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generations, setGenerations] = useState<{ url: string; id: string }[]>(
    [],
  );
  const [currentGenerationIdx, setCurrentGenerationIdx] = useState(-1);

  // Use ref to store generationId to avoid state timing issues
  const generationIdRef = useRef<string>("");

  const uploadedImgRef = useRef<HTMLImageElement | null>(null);
  const { models } = useModels();
  const { addImage } = useCreatedImages();

  const { fetchImage, loading, responseData } = useGeminiGenerator();

  useEffect(() => {
    if (responseData?.img && responseData?.generationId) {
      const newGeneration = {
        url: responseData.img,
        id: responseData.generationId,
      };
      const updatedGenerations = [...generations, newGeneration];
      setGenerations(updatedGenerations);
      setCurrentGenerationIdx(updatedGenerations.length - 1);
      generationIdRef.current = responseData.generationId;
      setImage(responseData.img);
    } else if (responseData?.error) {
      alert(t("aiImageGenerator.errors.generalError"));
    }
  }, [responseData]);

  useEffect(() => {
    // Update displayed image based on currentGenerationIdx
    console.log("Image effect triggered:", {
      currentGenerationIdx,
      hasOriginalImage: !!originalImage,
      generationsLength: generations.length,
    });
    if (currentGenerationIdx === -1) {
      // Show original image
      console.log("Showing original image:", originalImage);
      if (originalImage) {
        setImage(
          typeof originalImage === "string" ? originalImage : originalImage.url,
        );
      } else {
        console.warn(
          "originalImage is null/undefined but currentGenerationIdx is -1",
        );
      }
    } else if (
      currentGenerationIdx >= 0 &&
      generations.length > currentGenerationIdx
    ) {
      // Show image at current index
      console.log(
        "Showing generation image:",
        generations[currentGenerationIdx].url,
      );
      setImage(generations[currentGenerationIdx].url);
    }
  }, [currentGenerationIdx, generations, originalImage]);

  useEffect(() => {
    // Fetch image and generations from Firestore session
    const organizationId = localStorage.getItem(
      PERSISTENT_STORAGE.ORGANIZATION_ID,
    );
    const sessionId = sessionStorage.getItem(SESSION_STORAGE.SESSION_ID);

    // First, try to get the image from sessionStorage (initial selection)
    const selectedImage = sessionStorage.getItem(
      SESSION_STORAGE.SELECTED_IMAGE,
    );
    if (selectedImage) {
      try {
        const parsedImage = JSON.parse(selectedImage);
        const imageUrl = parsedImage.url;
        console.log("Setting image from sessionStorage:", imageUrl);
        setImage(imageUrl);
        setOriginalImage(imageUrl);
      } catch (error) {
        console.error(
          "Error parsing selected image from sessionStorage:",
          error,
        );
      }
    }

    if (organizationId && projectId && sessionId) {
      getSession(organizationId, projectId, sessionId)
        .then((sessionData) => {
          if (sessionData) {
            const originalImageData = sessionData.originalImage;
            if (originalImageData) {
              // Handle both string and object formats
              const imageUrl =
                typeof originalImageData === "string"
                  ? originalImageData
                  : originalImageData.url;
              console.log("Setting image from Firestore session");
              setImage(imageUrl);
              setOriginalImage(imageUrl);
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching session from Firestore:", error);
        });

      listGenerations(organizationId, projectId, sessionId)
        .then((generationDocs) => {
          const fetchedGenerations = generationDocs
            .sort(
              (left, right) =>
                toGenerationTimestampMs(left.createdAt) -
                toGenerationTimestampMs(right.createdAt),
            )
            .map((generation) => ({
              url: (generation.image as { url?: string } | undefined)?.url,
              id: String(generation.generationId),
            }))
            .filter(
              (generation): generation is { url: string; id: string } =>
                typeof generation.url === "string" && generation.url.length > 0,
            );

          console.log("fetchedGenerations", fetchedGenerations);
          if (fetchedGenerations.length > 0) {
            setGenerations(fetchedGenerations);
            const lastIdx = fetchedGenerations.length - 1;
            setCurrentGenerationIdx(lastIdx);
            setImage(fetchedGenerations[lastIdx].url);
          } else {
            setGenerations([]);
            setCurrentGenerationIdx(-1);
          }
        })
        .catch((error) => {
          console.error("Error fetching generations from Firestore:", error);
        });
    }
  }, []);

  const handleSubmit = async (
    e: React.FormEvent,
    retryCount = 0,
    retry = false,
  ) => {
    e.preventDefault();

    if (!image) return;

    let base64Image: string;

    if (image.startsWith("data:")) {
      // Already base64
      base64Image = image.split(",")[1];
    } else if (image.startsWith("http://") || image.startsWith("https://")) {
      // Remote URL - fetch and convert to base64
      try {
        const response = await fetch(image, {
          headers: {
            Accept: "image/*",
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const blob = await response.blob();
        const reader = new FileReader();
        base64Image = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64data = reader.result as string;
            resolve(base64data.split(",")[1]);
          };
          reader.onerror = () => reject(new Error("FileReader error"));
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error("Error fetching remote image:", error);
        alert(t("aiImageGenerator.errors.failedProcessImage"));
        return;
      }
    } else {
      // Local file - try to extract from canvas
      try {
        if (uploadedImgRef.current) {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Could not get canvas context");

          const img = uploadedImgRef.current;
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;

          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL("image/jpeg");
          base64Image = dataUrl.split(",")[1];
        } else {
          throw new Error("Image element not found");
        }
      } catch (error) {
        console.error("Error converting image to base64:", error);
        alert(t("aiImageGenerator.errors.failedProcessImage"));
        return;
      }
    }

    const promptToUse =
      selectedObjects.length > 0
        ? selectedObjects.map((obj) => obj.prompt).join(" and ")
        : "";

    const modelToUse =
      selectedObjects.length > 0 && selectedObjects[0].model
        ? selectedObjects[0].model
        : "default";
    const strengthToUse =
      selectedObjects.length > 0
        ? selectedObjects.reduce((acc, obj) => acc + (obj.strength || 1), 0) /
          selectedObjects.length
        : 1;

    setLastUsedObjects([...selectedObjects]);

    if (!retry) {
      setLastInputImage(image);
    }

    try {
      await fetchImage(
        promptToUse,
        base64Image,
        modelToUse,
        retryCount,
        strengthToUse,
      );

      // Only retry if no data was returned at all
      if (retryCount === 0 && !responseData) {
        console.log("No data returned, retrying...");
        await handleSubmit(e, 1);
      } else if (retryCount === 1 && !responseData) {
        alert(t("aiImageGenerator.errors.failedGenerateImageAfterRetry"));
      }
    } catch (error) {
      console.error("Error generating image:", error);
      if (retryCount === 0 && !responseData) {
        console.log("Error on first attempt with no data, retrying...");
        await handleSubmit(e, 1);
      } else {
        alert(t("aiImageGenerator.errors.failedGenerateImage"));
      }
    }
  };

  const handleRegenerate = (e: React.MouseEvent) => {
    setSelectedObjects([...lastUsedObjects]);
    if (lastInputImage) {
      setImage(lastInputImage);
    }
    handleSubmit(e, 0, true);
  };

  const handleRestart = () => {
    navigate(`${pathname?.split("/").slice(0, -1).join("/")}`);
  };

  const handleRestartImage = () => {
    if (originalImage) {
      setCurrentGenerationIdx(-1);
    }
  };

  const handleUndo = () => {
    if (currentGenerationIdx > 0) {
      // Go to previous generation
      setCurrentGenerationIdx(currentGenerationIdx - 1);
    } else if (currentGenerationIdx === 0) {
      // Go to original image
      setCurrentGenerationIdx(-1);
    }
  };

  const handleRedo = () => {
    if (currentGenerationIdx === -1) {
      // Go to first generation
      if (generations.length > 0) {
        setCurrentGenerationIdx(0);
      }
    } else if (currentGenerationIdx < generations.length - 1) {
      // Go to next generation
      const nextIdx = currentGenerationIdx + 1;
      setCurrentGenerationIdx(nextIdx);
    }
  };

  console.log("generations", generations, generationIdRef.current);

  const handleGallery = () => {
    openModal(<TileLibrary setImage={setImage} image={image} />, {
      id: "galleryModal",
      size: "xl",
      title: "Galerie",
    });
  };

  const handleFinish = () => {
    if (image && projectId) {
      openModal(
        <TitleModal
          image={image}
          selectedObjects={selectedObjects}
          projectId={projectId}
          generationId={generationIdRef.current}
          addImage={addImage}
          setShowAnimation={setShowAnimation}
          closeModal={closeModal}
          handleRestart={handleRestart}
        />,
        {
          title: "Bildtitel eingeben",
          id: "imageTitleModal",
        },
      );
    }
  };

  return (
    <>
      <ImageEditing
        initialImage={null}
        image={image}
        setImage={setImage}
        loading={loading}
        responseData={responseData}
        handleRegenerate={handleRegenerate}
        uploadedImgRef={uploadedImgRef}
      />

      <Transition
        show={true}
        style={{
          position: "fixed",
          left: 0,
          top: isMobile ? "45vh" : "0",
          width: isMobile ? "100vw" : "420px",
          height: isMobile ? "55vh" : "100vh",
          zIndex: 10,
          borderRight: isMobile ? "none" : "1px solid #E0E0E0",
          borderTop: isMobile ? "1px solid #E0E0E0" : "none",
          borderTopLeftRadius: isMobile ? "16px" : 0,
          borderTopRightRadius: isMobile ? "16px" : 0,
          boxShadow: isMobile ? "0 -8px 24px rgba(0,0,0,0.08)" : "none",
          backgroundColor: "white",
        }}
        from={{ opacity: 0, scale: 1 }}
        leave={{ opacity: 0, scale: 1 }}
        enter={{ opacity: 1, scale: 1 }}
      >
        {isMobile && (
          <div className="flex justify-center pt-2 pb-1">
            <div className="h-1.5 w-10 rounded-full bg-gray-300" />
          </div>
        )}
        <ObjectSelectionSection
          search={search}
          setSearch={setSearch}
          models={models}
          selectedObjects={selectedObjects}
          setSelectedObjects={setSelectedObjects}
          handleBack={handleRestart}
        />
        <div
          className={cn(
            "fixed bottom-0 left-0 z-[111] p-3 bg-white border-t pointer-events-auto md:p-5",
            isMobile ? "w-screen border-t" : "w-[418px]",
          )}
        >
          <div className="flex w-full items-center justify-between gap-2">
            {selectedObjects.length > 0 ? (
              <Button
                text={`${selectedObjects.length} ausgewählt`}
                variant="shapeless"
                size="sm"
                leadingIcon="trash"
                onClick={() => {
                  setSelectedObjects([]);
                }}
              />
            ) : (
              <div />
            )}

            <Button
              text="Bild erstellen"
              variant="primary"
              size="lg"
              disabled={selectedObjects.length === 0 || loading}
              disabledNotice={
                selectedObjects.length === 0
                  ? t("aiGenerator.errors.noObject")
                  : undefined
              }
              loading={loading}
              onClick={(e) => {
                console.log("handleNextStep called");
                handleSubmit(e);
              }}
            />
          </div>
        </div>
      </Transition>

      {image && (
        <Toolbar
          onRestart={handleRestartImage}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onFinish={handleFinish}
          onGallery={handleGallery}
          canUndo={currentGenerationIdx >= 0}
          canRedo={currentGenerationIdx < generations.length - 1}
          finishDisabled={
            generations.length === 0 || currentGenerationIdx === -1
          }
          isOriginalImage={currentGenerationIdx === -1}
          generationsCount={generations.length}
        />
      )}

      <AnimationPortal showAnimation={showAnimation} />
    </>
  );
};

export default AiImageGenerator;
