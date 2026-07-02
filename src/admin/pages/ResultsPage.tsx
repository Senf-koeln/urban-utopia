import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  getSession,
  listFinishedProjectGenerations,
  listSessionGenerationsOrdered,
} from "@/lib/dataAccess";
import { ChevronLeft, ChevronRight, Download, Play, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/aiImageGenerator/components/Header.tsx";
import { downloadGenerationImagesAsZip } from "../utils/downloadGenerationZip.ts";
import type { Generation } from "../../aiImageGenerator/types";

const toTimestampMs = (value: unknown): number => {
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

const isValidGeneration = (generation: Record<string, unknown>): generation is Generation & {
  id: string;
} => {
  const image = generation.image;
  return (
    typeof generation.generationId === "string" &&
    typeof generation.createdAt !== "undefined" &&
    typeof image === "object" &&
    image !== null &&
    typeof (image as { url?: unknown }).url === "string" &&
    Boolean((image as { url?: string }).url)
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
        autoplay
        className="w-full h-full scale-150"
      />
    </div>,
    document.body,
  );
};

const ResultsPage = () => {
  const { organizationId, projectId } = useParams<{
    organizationId: string;
    projectId?: string;
  }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenerationIndex, setSelectedGenerationIndex] = useState<
    number | null
  >(null);
  const [isPlayingSlideshow, setIsPlayingSlideshow] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [slideshowGenerations, setSlideshowGenerations] = useState<
    Generation[]
  >([]);
  const [slideshowSessionOriginalImage, setSlideshowSessionOriginalImage] =
    useState<string | null>(null);
  const [isPreviewSlideshow, setIsPreviewSlideshow] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [downloadingGenerationId, setDownloadingGenerationId] = useState<
    string | null
  >(null);

  // Hide animation after it plays once
  useEffect(() => {
    if (!showAnimation) return;

    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 3500); // Duration of the animation

    return () => clearTimeout(timer);
  }, [showAnimation]);

  // Fetch all generations for this project
  useEffect(() => {
    const fetchGenerations = async () => {
      try {
        setLoading(true);

        if (!organizationId || !projectId) {
          console.log("ResultsPage: Missing organizationId or projectId");
          setLoading(false);
          return;
        }

        // Query all generations across all sessions in this project
        const allGenerations = (
          await listFinishedProjectGenerations(organizationId, projectId)
        )
          .filter(isValidGeneration)
          .map((generation) => ({
            ...generation,
            id: generation.generationId,
          }));

        console.log(
          "ResultsPage: Fetched",
          allGenerations.length,
          "generations",
        );

        // Sort generations chronologically (oldest first)
        const sortedGenerations = [...allGenerations].sort(
          (a, b) => toTimestampMs(a.createdAt) - toTimestampMs(b.createdAt),
        );

        setGenerations(sortedGenerations);
      } catch (error) {
        console.error("Error fetching generations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGenerations();
  }, [organizationId, projectId]);

  // Handle slideshow auto-advance
  useEffect(() => {
    if (!isPlayingSlideshow) return;

    const timer = setTimeout(() => {
      // Total items: 1 original + slideshow generations
      const totalItems = slideshowGenerations.length + 1;
      if (slideshowIndex < totalItems - 1) {
        setSlideshowIndex(slideshowIndex + 1);
      } else {
        // Reached the last image, stop auto-advance and exit slideshow mode
        setIsPlayingSlideshow(false);
        setIsPreviewSlideshow(false);
        setShowAnimation(true); // Trigger animation when slideshow ends
      }
    }, 2000); // 2 seconds per image

    return () => clearTimeout(timer);
  }, [isPlayingSlideshow, slideshowIndex, slideshowGenerations.length]);

  const handleDownloadGeneration = async (generation: Generation & { id: string }) => {
    try {
      setDownloadingGenerationId(generation.id);
      await downloadGenerationImagesAsZip(generation);
    } catch (error) {
      console.error("Error downloading generation images:", error);
    } finally {
      setDownloadingGenerationId(null);
    }
  };

  const handlePlaySlideshow = async (generation: Generation) => {
    try {
      // Fetch all generations for this specific session
      const sessionGenerations = (
        await listSessionGenerationsOrdered(
          generation.organizationId as string,
          generation.projectId as string,
          generation.sessionId as string,
          "asc",
        )
      )
        .filter(isValidGeneration)
        .map((sessionGeneration) => ({
          ...sessionGeneration,
          id: sessionGeneration.generationId,
        }));

      console.log("Slideshow generations fetched:", sessionGenerations.length);

      // Fetch the original image for this session
      const sessionDoc = await getSession(
        generation.organizationId as string,
        generation.projectId as string,
        generation.sessionId as string,
      );
      const sessionOriginalImage = sessionDoc
        ? (sessionDoc.originalImage as { url?: string } | undefined)?.url || null
        : null;

      console.log(
        "Session original image:",
        sessionOriginalImage ? "found" : "not found",
      );

      setSlideshowGenerations(sessionGenerations);
      setSlideshowSessionOriginalImage(sessionOriginalImage);
      setIsPlayingSlideshow(true);
      setSlideshowIndex(0);
      setIsPreviewSlideshow(true);
    } catch (error) {
      console.error("Error preparing slideshow:", error);
    }
  };

  return (
    <div className="h-screen w-screen overflow-y-auto bg-gray-50">
      <Header
        handleBack={() =>
          navigate(`/organizations/${organizationId}/projects/`)
        }
        title={t("admin.pages.resultsPage.title")}
      />
      <p className="text-gray-600 absolute top-6 right-6">
        {t("admin.pages.resultsPage.imageCount", { count: generations.length })}
      </p>
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-screen">
            <div className="text-center -mt-20">
              <p className="body-lg">{t("admin.pages.resultsPage.loading")}</p>
            </div>
          </div>
        ) : generations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-screen">
            <div className="text-center -mt-20">
              <p className="body-lg">{t("admin.pages.resultsPage.noImages")}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {generations.map((generation, index) => (
              <button
                key={generation.id}
                type="button"
                className="rounded-lg overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer group text-left w-full border-0 p-0"
                onClick={() => setSelectedGenerationIndex(index)}
              >
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={generation.image.url}
                    alt="Generated"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Download button in top right corner */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDownloadGeneration(generation);
                    }}
                    disabled={downloadingGenerationId === generation.id}
                    className="absolute top-2 right-2 bg-white hover:bg-gray-100 disabled:opacity-60 disabled:cursor-wait text-gray-900 p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title={t("admin.pages.resultsPage.downloadTitle")}
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </div>

                {/* Footer with title and prompt */}
                <div className="p-3 border-t border-gray-200">
                  {generation.title && (
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      {generation.title}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div className="px-3 pb-3 text-xs text-gray-400">
                  {new Date(generation.createdAt).toLocaleDateString("de-DE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full-screen image preview modal */}
      {selectedGenerationIndex !== null &&
        generations[selectedGenerationIndex] && (
          <button
            type="button"
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 border-0 cursor-default bg-opacity-90"
            onClick={() => {
              setSelectedGenerationIndex(null);
              setIsPreviewSlideshow(false);
              setIsPlayingSlideshow(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSelectedGenerationIndex(null);
                setIsPreviewSlideshow(false);
                setIsPlayingSlideshow(false);
              }
            }}
            style={{ padding: 0, margin: 0 }}
          >
            <button
              type="button"
              onClick={() => {
                setSelectedGenerationIndex(null);
                setIsPreviewSlideshow(false);
                setIsPlayingSlideshow(false);
              }}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>

            <div className="flex flex-col items-center gap-1 w-full h-screen justify-between">
              {isPreviewSlideshow ? (
                <>
                  <div className="relative w-full flex-1 flex items-center justify-center rounded-lg overflow-hidden my-4 max-w-[calc(100vw-20px)] max-h-[calc(100vh-120px)]">
                    {/* Original Image */}
                    {slideshowSessionOriginalImage ? (
                      <img
                        src={slideshowSessionOriginalImage}
                        alt="Original"
                        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ease-in-out ${
                          slideshowIndex === 0 ? "opacity-100" : "opacity-0"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                          }
                        }}
                      />
                    ) : (
                      <div
                        className={`absolute inset-0 flex items-center justify-center bg-gray-700 transition-opacity duration-1000 ease-in-out ${
                          slideshowIndex === 0 ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        <div className="text-white text-center">
                          <p className="text-2xl font-semibold mb-2">
                            {t("admin.pages.resultsPage.originalImage")}
                          </p>
                          <p className="text-gray-300">
                            {t("admin.pages.resultsPage.notAvailable")}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* All Generation Images */}
                    {slideshowGenerations.map((generation, idx) => (
                      <img
                        key={`gen-${generation.id}`}
                        src={generation.image.url || ""}
                        alt={`Generation ${idx + 1}`}
                        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ease-in-out ${
                          slideshowIndex === idx + 1
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                          }
                        }}
                      />
                    ))}
                  </div>

                  {/* Slideshow Controls */}
                  <div className="flex gap-3 py-4">
                    <button
                      type="button"
                      onClick={() => setIsPlayingSlideshow(!isPlayingSlideshow)}
                      className="bg-white hover:bg-gray-100 text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      {isPlayingSlideshow
                        ? t("admin.pages.resultsPage.stop")
                        : t("admin.pages.resultsPage.continue")}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {generations[selectedGenerationIndex].title && (
                    <h2 className="text-white text-xl font-semibold pt-4 mb-4">
                      {generations[selectedGenerationIndex].title}
                    </h2>
                  )}
                  <div className="relative w-full flex-1 flex items-center justify-center rounded-lg overflow-hidden my-4 max-w-[calc(100vw-20px)] max-h-[calc(100vh-120px)]">
                    <img
                      src={generations[selectedGenerationIndex].image.url}
                      alt="Preview"
                      className="absolute inset-0 w-full h-full object-contain"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                        }
                      }}
                    />
                  </div>

                  <div className="flex gap-3 pb-4">
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        await handlePlaySlideshow(
                          generations[selectedGenerationIndex],
                        );
                      }}
                      className="bg-white hover:bg-gray-100 text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <Play className="h-5 w-5" />
                      {t("admin.pages.resultsPage.play")}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Left Navigation Button */}
            {selectedGenerationIndex > 0 && !isPreviewSlideshow && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedGenerationIndex(selectedGenerationIndex - 1);
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-100 text-gray-900 p-3 rounded-full transition-colors z-10"
                title={t("admin.pages.resultsPage.previousTitle")}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Right Navigation Button */}
            {selectedGenerationIndex < generations.length - 1 &&
              !isPreviewSlideshow && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGenerationIndex(selectedGenerationIndex + 1);
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-100 text-gray-900 p-3 rounded-full transition-colors z-10"
                  title={t("admin.pages.resultsPage.nextTitle")}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
          </button>
        )}

      {/* Remove the separate slideshow modal */}
      <AnimationPortal showAnimation={showAnimation} />
    </div>
  );
};

export default ResultsPage;
