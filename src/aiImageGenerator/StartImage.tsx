import { ArrowLeft, Camera, Image, Upload } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Seperator } from "@ui";
import { cn } from "@ui/util/classNameConstructor";
import {
  findProjectAcrossOrganizations,
  generateBase62Id,
  insertSession,
  listSessionGenerationsPage,
  listSessionsByUser,
} from "@/lib/dataAccess";
import ChooseFromStreetView from "./ChooseFromStreetView";
import Header from "./components/Header";
import TopBar from "./components/TopBar";
import { PERSISTENT_STORAGE, SESSION_STORAGE } from "./constants/storageKeys";
import type { Session } from "./types";
import {
  uploadSessionOriginalFile,
  uploadSessionOriginalImageUrl,
} from "./utils/firebaseUtils";

interface SelectionOption {
  id: "existing" | "streetview" | "upload";
  titleKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
  bgColor: string;
}

interface ProjectImage {
  id: string;
  url: string;
  caption: string;
  projectId: string;
}

interface PreviousSession {
  id: string;
  prompt: string;
  imageUrl?: string;
  createdAt: string;
  sessionId: string;
  projectId: string;
}

interface ProjectSettings {
  enableImageUpload?: boolean;
  enableGoogleStreetView?: boolean;
}

const StartImage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [previousSessions, setPreviousSessions] = useState<PreviousSession[]>(
    [],
  );
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({});
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const existingUserId = localStorage.getItem(PERSISTENT_STORAGE.USER_ID);
    if (!existingUserId) {
      const newUserId = generateBase62Id();
      localStorage.setItem(PERSISTENT_STORAGE.USER_ID, newUserId);
    }

    // Store project context for all image sources
    if (projectId) {
      localStorage.setItem(PERSISTENT_STORAGE.PROJECT_ID, projectId);
    }
  }, [projectId]);

  useEffect(() => {
    const fetchProjectSettings = async () => {
      try {
        setLoadingSettings(true);
        const projectMatch = await findProjectAcrossOrganizations(projectId || "");
        if (projectMatch) {
          const data = projectMatch.project;
          setProjectSettings({
            enableImageUpload: (data.enableImageUpload as boolean) || false,
            enableGoogleStreetView:
              (data.enableGoogleStreetView as boolean) || false,
          });
          localStorage.setItem(
            PERSISTENT_STORAGE.ORGANIZATION_ID,
            projectMatch.organizationId,
          );
        }
      } catch (error) {
        console.error("Error fetching project settings:", error);
      } finally {
        setLoadingSettings(false);
      }
    };

    if (projectId) {
      fetchProjectSettings();
    }
  }, [projectId]);

  useEffect(() => {
    const fetchProjectImages = async () => {
      try {
        setLoadingImages(true);
        const projectMatch = await findProjectAcrossOrganizations(projectId || "");
        if (
          projectMatch &&
          projectMatch.project.images &&
          Array.isArray(projectMatch.project.images)
        ) {
          const projectImages = projectMatch.project.images.map(
            (img: { id: string; url: string; caption: string }) => ({
              ...img,
              projectId: projectId || "",
            }),
          );
          setImages(projectImages);
        }
      } catch (error) {
        console.error("Error fetching project images:", error);
      } finally {
        setLoadingImages(false);
      }
    };

    fetchProjectImages();
  }, [projectId]);

  useEffect(() => {
    const fetchPreviousSessions = async () => {
      try {
        setLoadingSessions(true);
        const organizationId = localStorage.getItem(
          PERSISTENT_STORAGE.ORGANIZATION_ID,
        );
        const userId = localStorage.getItem(PERSISTENT_STORAGE.USER_ID);

        console.log(
          "fetchPreviousSessions: userId =",
          userId,
          "orgId =",
          organizationId,
        );

        if (!userId || !organizationId || !projectId) {
          console.log(
            "fetchPreviousSessions: missing userId, organizationId or projectId, returning",
          );
          setLoadingSessions(false);
          return;
        }

        // Fetch all sessions from this project
        const sessionRecords = await listSessionsByUser(
          organizationId,
          projectId,
          userId,
        );
        console.log(
          "fetchPreviousSessions: found",
          sessionRecords.length,
          "sessions",
        );

        const sessions: PreviousSession[] = [];

        for (const sessionRecord of sessionRecords.slice(0, 5)) {
          const sessionData = sessionRecord;
          const sessionId = sessionRecord.sessionId as string;

          try {
            const generationsPage = await listSessionGenerationsPage(
              organizationId,
              projectId,
              sessionId,
              { pageSize: 1 },
            );
            const latestGeneration = generationsPage.generations[0];

            const imageUrl =
              (latestGeneration?.image as { url?: string } | undefined)?.url ||
              (sessionData.originalImage as { url?: string } | undefined)?.url;
            const prompt = (latestGeneration?.prompt as string) || "";

            sessions.push({
              id: sessionId,
              prompt,
              imageUrl,
              createdAt: sessionData.createdAt as string,
              sessionId,
              projectId,
            });

            console.log(
              `fetchPreviousSessions: session ${sessionId} - image from ${latestGeneration ? "latest generation" : "original image"}`,
            );
          } catch (error) {
            console.error("Error fetching generations for session:", error);
            // Fall back to original image if generations fetch fails
            sessions.push({
              id: sessionId,
              prompt: "",
              imageUrl: (sessionData.originalImage as { url?: string } | undefined)
                ?.url,
              createdAt: sessionData.createdAt as string,
              sessionId,
              projectId,
            });
          }
        }

        console.log("fetchPreviousSessions: final sessions:", sessions);
        setPreviousSessions(sessions);
      } catch (error) {
        console.error("Error fetching previous sessions:", error);
      } finally {
        setLoadingSessions(false);
      }
    };

    fetchPreviousSessions();
  }, [projectId]);

  const handleSessionSelect = (session: PreviousSession) => {
    try {
      // Set the session ID in sessionStorage so useFetchLibrary can query it
      sessionStorage.setItem(SESSION_STORAGE.SESSION_ID, session.sessionId);

      // Set the latest generation image as the initial image
      if (session.imageUrl) {
        localStorage.setItem(
          PERSISTENT_STORAGE.START_IMAGE_URL,
          session.imageUrl,
        );
        sessionStorage.setItem(
          SESSION_STORAGE.SELECTED_IMAGE,
          JSON.stringify({
            url: session.imageUrl,
            sessionId: session.sessionId,
            prompt: session.prompt,
          }),
        );
      }

      navigate("edit");
    } catch (error) {
      console.error("Failed to load session:", error);
      alert(t("startImage.errors.failedLoadSession"));
    }
  };

  const getAvailableOptions = (): SelectionOption[] => {
    const baseOptions: SelectionOption[] = [
      {
        id: "existing",
        titleKey: "startImage.existing.title",
        descriptionKey: "startImage.existing.description",
        icon: <Image className="w-12 h-12 text-gray-700" />,
        bgColor: "bg-cyan-100",
      },
      {
        id: "streetview",
        titleKey: "startImage.streetview.title",
        descriptionKey: "startImage.streetview.description",
        icon: <Camera className="w-12 h-12 text-gray-700" />,
        bgColor: "bg-lime-100",
      },
      {
        id: "upload",
        titleKey: "startImage.upload.title",
        descriptionKey: "startImage.upload.description",
        icon: <Upload className="w-12 h-12 text-gray-700" />,
        bgColor: "bg-amber-100",
      },
    ];

    return baseOptions.filter((option) => {
      if (option.id === "existing") {
        return images.length > 0;
      }
      if (option.id === "streetview") {
        return projectSettings.enableGoogleStreetView === true;
      }
      if (option.id === "upload") {
        return projectSettings.enableImageUpload === true;
      }
      return true;
    });
  };

  const handleImageSelect = async (
    image: ProjectImage,
    _imgElement: HTMLImageElement,
  ) => {
    try {
      const userId = localStorage.getItem("user_id") || generateBase62Id();
      const organizationId =
        localStorage.getItem("org_id") || image.organizationId;
      const projectId = image.projectId;

      const sessionId = generateBase62Id();
      sessionStorage.setItem(SESSION_STORAGE.SESSION_ID, sessionId);

      const imageUrl = await uploadSessionOriginalImageUrl(
        image.url,
        sessionId,
        image.caption || "project-image.jpg",
      );

      const sessionData: Session = {
        originalImage: {
          url: imageUrl,
          name: image.caption || "project-image",
          source: "project-gallery",
          uploadedAt: new Date().toISOString(),
        },
        userId,
        projectId,
        organizationId,
        createdAt: new Date().toISOString(),
      };

      await insertSession(organizationId, projectId, sessionId, sessionData);

      localStorage.setItem(PERSISTENT_STORAGE.USER_ID, userId);
      localStorage.setItem(PERSISTENT_STORAGE.ORGANIZATION_ID, organizationId);
      localStorage.setItem(PERSISTENT_STORAGE.PROJECT_ID, projectId);
      localStorage.setItem(PERSISTENT_STORAGE.START_IMAGE_URL, imageUrl);
      sessionStorage.setItem(
        SESSION_STORAGE.SELECTED_IMAGE,
        JSON.stringify({
          ...image,
          url: imageUrl,
          sessionId,
        }),
      );

      navigate("edit");
    } catch (error) {
      console.error("Failed to process image:", error);
      alert(t("startImage.errors.failedProcessImage"));
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      const userId = localStorage.getItem("user_id") || generateBase62Id();
      const organizationId = localStorage.getItem("org_id");
      const projectId =
        localStorage.getItem(PERSISTENT_STORAGE.PROJECT_ID) || "device-upload";

      const sessionId = generateBase62Id();
      sessionStorage.setItem(SESSION_STORAGE.SESSION_ID, sessionId);

      const imageUrl = await uploadSessionOriginalFile(file, sessionId);

      if (organizationId) {
        const sessionData: Session = {
          originalImage: {
            url: imageUrl,
            name: file.name,
            source: "file-upload",
            uploadedAt: new Date().toISOString(),
          },
          userId,
          projectId,
          organizationId,
          createdAt: new Date().toISOString(),
        };

        await insertSession(organizationId, projectId, sessionId, sessionData);
      }

      localStorage.setItem(PERSISTENT_STORAGE.USER_ID, userId);
      localStorage.setItem(PERSISTENT_STORAGE.START_IMAGE_URL, imageUrl);
      if (organizationId) {
        localStorage.setItem(
          PERSISTENT_STORAGE.ORGANIZATION_ID,
          organizationId,
        );
      }
      localStorage.setItem(PERSISTENT_STORAGE.PROJECT_ID, projectId);
      sessionStorage.setItem(
        SESSION_STORAGE.SELECTED_IMAGE,
        JSON.stringify({
          id: generateBase62Id(),
          url: imageUrl,
          caption: file.name,
          projectId,
          sessionId,
        }),
      );
      navigate("edit");
    } catch (error) {
      console.error("Failed to process image:", error);
      alert(t("startImage.errors.failedProcessImage"));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleOptionClick = (optionId: string) => {
    if (optionId === "upload") {
      const fileInput = document.getElementById(
        "file-input",
      ) as HTMLInputElement;
      fileInput?.click();
    } else {
      setSelectedOption(optionId);
    }
  };

  const options = getAvailableOptions();

  // Image Library View
  if (selectedOption === "existing") {
    return (
      <div className="h-screen w-screen overflow-y-scroll">
        <Header
          handleBack={() => setSelectedOption(null)}
          title={t("startImage.library.title")}
        />
        <div className={cn("flex flex-col gap-4 p-4 md:gap-8 md:p-8")}>
          {loadingImages ? (
            <div className="flex justify-center items-center py-24">
              <p className="text-gray-500 text-lg">
                {t("startImage.library.loading")}
              </p>
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 pb-6 md:flex md:justify-center md:flex-wrap md:gap-4 md:pb-8">
              {images.map((image) => (
                <button
                  key={image.id}
                  onClick={() => {
                    handleImageSelect(image, null as any);
                  }}
                  style={{
                    border: "2px solid rgb(107, 114, 128)",
                  }}
                  className="flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer w-full md:w-auto"
                >
                  <img
                    src={image.url}
                    alt={image.caption || "Uploaded image"}
                    className="w-full h-32 object-cover md:w-auto md:h-48"
                  />
                  {image.caption && (
                    <div className="p-2 bg-white md:p-3">
                      <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
                        {image.caption || t("startImage.library.noCaption")}
                      </p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center py-24">
              <p className="text-gray-500 text-lg">
                {t("startImage.library.noImages")}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Street View Selection
  if (selectedOption === "streetview") {
    return <ChooseFromStreetView onBack={() => setSelectedOption(null)} />;
  }

  // Main Options View
  return (
    <div
      className={cn(
        "min-h-screen w-screen flex flex-col gap-6 p-4 pt-20 bg-white overflow-y-scroll md:gap-12 md:p-8 md:pt-8",
      )}
    >
      <TopBar />
      <div className="flex flex-col gap-2 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 text-center md:text-5xl">
          {t("startImage.title")}
        </h1>
      </div>

      <div
        className={cn(
          "flex flex-col gap-3 w-full md:flex-row md:gap-6 md:max-w-5xl md:mx-auto md:justify-center",
        )}
      >
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleOptionClick(option.id)}
            style={{
              border:
                selectedOption === option.id
                  ? "2px solid rgb(17, 24, 39)"
                  : "2px solid rgb(107, 114, 128)",
            }}
            className={cn(
              "flex flex-row items-stretch rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer md:flex-col md:flex-1",
              selectedOption === option.id ? "shadow-lg" : "hover:shadow-md",
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center shrink-0 w-24 md:w-full md:py-12",
                option.bgColor,
              )}
            >
              {option.icon}
            </div>
            <div className="p-4 bg-white flex-1 flex flex-col gap-1 justify-center md:p-6 md:gap-2 md:justify-start">
              <h3 className="text-base font-semibold text-gray-900 text-left md:text-lg">
                {t(option.titleKey)}
              </h3>
              <p className="text-xs text-gray-500 text-left md:text-sm">
                {t(option.descriptionKey)}
              </p>
            </div>
          </button>
        ))}
      </div>

      <input
        id="file-input"
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {!loadingSessions && previousSessions.length > 0 && (
        <div className="flex flex-col gap-3 w-full md:max-w-5xl md:mx-auto md:gap-4">
          <Seperator />
          <h2 className="text-base font-semibold text-gray-900 md:text-lg">
            Vorherige
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:gap-4 md:mx-0 md:px-0">
            {previousSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleSessionSelect(session)}
                className="flex-shrink-0 flex flex-col rounded-lg overflow-hidden outline-2 outline-gray-800 hover:border-gray-900 transition-all cursor-pointer min-w-[110px] h-[140px] md:min-w-[150px] md:h-[200px] border-2 border-gray-800 aspect-square"
                style={{
                  border: "2px solid rgb(107, 114, 128)",
                }}
              >
                {session?.imageUrl && (
                  <img
                    src={session.imageUrl}
                    alt={session.prompt}
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StartImage;
