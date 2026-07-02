import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { LazyLoadImageProps } from "react-lazy-load-image-component";
import { LazyLoadImage } from "react-lazy-load-image-component";
import Button from "@ui/components/core/button/Button";
import Spinner from "@ui/components/core/spinner/Spinner";
import useInfiniteScroll from "@ui/hooks/useInfiniteScroll";
import { cn } from "@ui/util/classNameConstructor";
import "react-lazy-load-image-component/src/effects/blur.css";
import { Icon, useIsMobile, useModals } from "@ui";
import { getSession } from "@/lib/dataAccess";
import { PERSISTENT_STORAGE, SESSION_STORAGE } from "./constants/storageKeys";
import useFetchLibrary from "./hooks/useFetchLibrary";
import type { Generation, OriginalImage } from "./types";

// Extend the LazyLoadImage props to ensure proper typing
type CustomLazyLoadImageProps = LazyLoadImageProps & {
  wrapperClassName?: string;
};

// Declare the module to fix the type error
declare module "react-lazy-load-image-component" {
  export const LazyLoadImage: React.ComponentType<CustomLazyLoadImageProps>;
}

interface TileLibraryProps {
  setImage: (url: string) => void;
  image: string | null;
}

const TileLibrary: React.FC<TileLibraryProps> = ({ setImage, image }) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { closeModal } = useModals();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  const [originalImage, setOriginalImage] = useState<OriginalImage | null>(
    null,
  );
  const [loadingSession, setLoadingSession] = useState(true);

  const organizationId = localStorage.getItem(
    PERSISTENT_STORAGE.ORGANIZATION_ID,
  );
  const projectId = localStorage.getItem(PERSISTENT_STORAGE.PROJECT_ID);
  const sessionId = sessionStorage.getItem(SESSION_STORAGE.SESSION_ID);

  const {
    loadingLibrary,
    library,
    errorInLibrary,
    fetchLibrary,
    hasMorePages,
  } = useFetchLibrary();

  // Fetch session document to get original image
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoadingSession(true);
        if (!organizationId || !projectId || !sessionId) {
          console.log("TileLibrary: Missing session identifiers");
          setLoadingSession(false);
          return;
        }

        const sessionData = await getSession(
          organizationId,
          projectId,
          sessionId,
        );

        if (sessionData) {
          setOriginalImage(
            (sessionData.originalImage as OriginalImage | null) || null,
          );
          console.log("TileLibrary: Loaded original image from session");
        }
      } catch (error) {
        console.error("Error fetching session data:", error);
      } finally {
        setLoadingSession(false);
      }
    };

    fetchSessionData();
  }, [organizationId, projectId, sessionId]);

  const [sentryRef] = useInfiniteScroll({
    loading: loadingLibrary,
    hasNextPage: hasMorePages,
    onLoadMore: fetchLibrary,
    rootMargin: "0px",
    disabled: !!errorInLibrary,
  });

  useEffect(() => {
    console.log("TileLibrary: Fetching library...");
    fetchLibrary();
  }, [fetchLibrary]);

  useEffect(() => {
    console.log("TileLibrary: Library updated", {
      libraryLength: library?.length,
      hasMorePages,
      loadingLibrary,
      errorInLibrary,
    });

    if (
      scrollContainerRef.current &&
      isInitialLoad.current &&
      library?.length
    ) {
      scrollContainerRef.current.scrollLeft =
        scrollContainerRef.current.scrollWidth;
      isInitialLoad.current = false;
    }
  }, [library, loadingLibrary, hasMorePages, errorInLibrary]);

  const renderGenerationItem = (generation: Generation, index: number) => {
    return (
      <div
        className="w-full h-auto aspect-square rounded-lg overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
        key={`generation-${generation.id}-${index}`}
      >
        <div
          className={cn(
            "relative w-full h-full aspect-square overflow-hidden bg-gray-100",
            generation.image.url === image && "",
          )}
          onClick={() => {
            setImage(generation.image.url);
            closeModal();
          }}
        >
          {/* <LazyLoadImage
            src={generation.image.url}
            onClick={() => {
              setImage(generation.image.url);
              closeModal();
            }}
            className={cn(
              "w-full h-full cursor-pointer object-cover transition-transform duration-300 group-hover:scale-105",
            )}
            style={{ willChange: "transform" }}
            wrapperClassName="w-full h-full"
            alt="Generated image"
            effect="blur"
          /> */}

          <img
            src={generation.image.url}
            alt="Generated"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {generation.image.url === image && (
            <div className="absolute top-2 right-2 bg-white border text-black text-xs font-semibold px-1 py-1 rounded-full">
              <Icon name="checkmark-md" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOriginalImage = () => {
    if (!originalImage) return null;

    return (
      <div className="w-full h-auto aspect-square rounded-lg overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer group">
        <div
          className={cn(
            "relative w-full h-full aspect-square overflow-hidden bg-gray-100",
            originalImage.url === image && "",
          )}
          onClick={() => {
            setImage(originalImage.url);
            closeModal();
          }}
        >
          {/* <LazyLoadImage
            src={originalImage.url}
            alt="Original image"
            onClick={() => {
              setImage(originalImage.url);
              closeModal();
            }}
            className={cn(
              "w-full h-full cursor-pointer object-cover transition-transform duration-300 group-hover:scale-105",
            )}
            style={{ willChange: "transform" }}
            wrapperClassName="w-full h-full"
            effect="blur"
          /> */}
          <img
            src={originalImage.url}
            alt="Original image"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {originalImage.url === image && (
            <div className="absolute top-2 right-2 bg-white border text-black text-xs font-semibold px-1 py-1 rounded-full">
              <Icon name="checkmark-md" />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Filter out generations that are duplicates or match the original image
  const uniqueGenerations = library.filter((generation) => {
    // Don't show generation if it matches the original image URL
    if (originalImage && generation.image.url === originalImage.url) {
      console.log(
        "TileLibrary: Filtering out duplicate generation matching original image",
      );
      return false;
    }
    // Remove any other duplicates by checking if this is the first occurrence
    const firstIndex = library.findIndex(
      (g) => g.image.url === generation.image.url,
    );
    return library.indexOf(generation) === firstIndex;
  });

  if (!library || library.length === 0) {
    console.log("TileLibrary: Not rendering - no library data", {
      library: library?.length,
      loadingLibrary,
    });
    return null;
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      {uniqueGenerations?.length > 0 && (
        <div
          ref={scrollContainerRef}
          className="grid grid-cols-2 gap-2 w-full auto-rows-max px-3 pb-3 sm:grid-cols-3 md:grid-cols-4 md:gap-3 md:px-5 md:pb-5"
        >
          {originalImage && renderOriginalImage()}

          {[...uniqueGenerations]
            .reverse()
            ?.map((generation, index) =>
              renderGenerationItem(generation, index),
            )}

          {hasMorePages && (
            <div
              ref={sentryRef}
              className="col-span-full h-16 flex items-center justify-center"
            >
              {loadingLibrary && <Icon name="loading" />}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TileLibrary;
