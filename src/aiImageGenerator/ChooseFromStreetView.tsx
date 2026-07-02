import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button, Geocoder } from "@ui";
import useStreetview from "@ui/components/atoms/map/useStreetview";
import { cn } from "@ui/util/classNameConstructor";
import { generateBase62Id, insertSession } from "@/lib/dataAccess";
import Header from "./components/Header";
import { PERSISTENT_STORAGE, SESSION_STORAGE } from "./constants/storageKeys";
import type { Session } from "./types";
import { uploadSessionOriginalImageUrl } from "./utils/firebaseUtils";

interface LocationData {
  address: string;
  lat: number;
  lng: number;
  streetViewUrl: string;
}

interface ChooseFromStreetViewProps {
  onBack: () => void;
}

const ChooseFromStreetView = ({ onBack }: ChooseFromStreetViewProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null,
  );
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const imageUrlRef = useRef<string | null>(null);

  // Use index 1 to trigger initialization in the hook
  const { handleSearchAddress, panoRef, googleMapRef, handleGetPano } =
    useStreetview((imageUrl: string) => {
      console.log("Image captured:", imageUrl);
      imageUrlRef.current = imageUrl;
      setCapturedImageUrl(imageUrl);
    }, 1);

  const handleBack = () => {
    onBack();
  };

  const handleContinue = async () => {
    if (isLoading || !panoRef?.current) return;

    setIsLoading(true);
    try {
      // Reset ref before capturing
      imageUrlRef.current = null;

      // Trigger capture
      await handleGetPano();

      // Wait for the captured image with a timeout
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds with 100ms intervals

      while (!imageUrlRef.current && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      const imageToUse = imageUrlRef.current;

      // After image is captured, route to edit page
      if (imageToUse) {
        const userId =
          localStorage.getItem(PERSISTENT_STORAGE.USER_ID) ||
          generateBase62Id();
        const organizationId = localStorage.getItem(
          PERSISTENT_STORAGE.ORGANIZATION_ID,
        );
        const projectId = localStorage.getItem(PERSISTENT_STORAGE.PROJECT_ID);

        const sessionId = generateBase62Id();
        sessionStorage.setItem(SESSION_STORAGE.SESSION_ID, sessionId);

        const imageUrl = await uploadSessionOriginalImageUrl(
          imageToUse,
          sessionId,
          "streetview-capture.jpg",
        );

        // Create session document in Firestore only if we have project context
        if (organizationId && projectId) {
          const sessionData: Session = {
            originalImage: {
              url: imageUrl,
              name: "streetview-capture",
              source: "streetview",
              uploadedAt: new Date().toISOString(),
            },
            userId,
            projectId,
            organizationId,
            createdAt: new Date().toISOString(),
          };

          await insertSession(
            organizationId,
            projectId,
            sessionId,
            sessionData,
          );
        } else {
          console.warn(
            "Missing project context for session creation. organizationId or projectId undefined.",
          );
        }

        localStorage.setItem(PERSISTENT_STORAGE.USER_ID, userId);
        localStorage.setItem(PERSISTENT_STORAGE.START_IMAGE_URL, imageUrl);
        localStorage.setItem(
          PERSISTENT_STORAGE.ORGANIZATION_ID,
          organizationId || "",
        );
        localStorage.setItem(PERSISTENT_STORAGE.PROJECT_ID, projectId || "");
        sessionStorage.setItem(
          SESSION_STORAGE.SELECTED_IMAGE,
          JSON.stringify({
            url: imageUrl,
            source: "streetview",
            sessionId,
          }),
        );

        navigate("edit");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Google Map element with proper dimensions - will be moved into googleMapContainer by effect */}
      <div
        ref={googleMapRef}
        id="googleMap"
        className="absolute z-0"
        style={{ width: "100%", height: "100%" }}
      />

      <Header
        handleBack={handleBack}
        handleContinue={handleContinue}
        continueLoading={isLoading || !panoRef?.current}
        title={t("streetview.pageTitle")}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex flex-col gap-4 flex-1 relative md:flex-row md:gap-6">
          <div className="w-full flex flex-col gap-3 md:w-[420px] md:gap-4">
            <div className="relative w-full">
              <Geocoder
                callback={handleSearchAddress}
                proximity={{
                  longitude: 10.4515,
                  latitude: 51.1657,
                }}
                geolocate={false}
                placeholder={t("streetview.placeholder")}
              />
            </div>

            <div
              className={cn(
                "relative z-40 h-44 w-full rounded-lg border-2 border-gray-800 overflow-hidden md:h-96",
              )}
              id="googleMapContainer"
            />
          </div>

          {/* Map and Street View Container */}
          <div className="flex gap-6 flex-1 relative min-h-[280px] md:min-h-0">
            {/* Street View */}
            <div className="flex-1 border-2 border-gray-800 rounded-xl overflow-hidden bg-gray-100 relative md:rounded-2xl">
              <div
                id="pano"
                ref={panoRef}
                className={cn("w-full h-full absolute inset-0")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChooseFromStreetView;
