import {
  getDownloadURL,
  ref,
  storage,
  uploadBytes,
} from "@/lib/storage";
import { Check, Copy, ImagePlus, Loader2, Trash2 } from "lucide-react";
// @ts-expect-error - qrcode module lacks type definitions
import QRCode from "qrcode";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useDiscardModal, useIsMobile } from "@ui";
import Button from "@ui/components/core/button/Button";
import { cn } from "@ui/util/classNameConstructor";
import { deleteProject, getProject, updateProject } from "@/lib/dataAccess";
import Header from "@/aiImageGenerator/components/Header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";

interface ProjectData {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  enableImageUpload?: boolean;
  enableGoogleStreetView?: boolean;
  images: Array<{
    id: string;
    url: string;
    caption: string;
  }>;
}

const ProjectPage: React.FC = () => {
  const { organizationId, projectId } = useParams<{
    organizationId: string;
    projectId: string;
  }>();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [enableImageUpload, setEnableImageUpload] = useState(true);
  const [enableStreetView, setEnableStreetView] = useState(true);
  const [images, setImages] = useState<ProjectData["images"]>([]);
  const [uploading, setUploading] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const inviteLinkRef = useRef<HTMLInputElement>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProject = useCallback(async () => {
    if (!organizationId || !projectId) return;

    try {
      setLoading(true);
      const projectRecord = await getProject(organizationId, projectId);

      if (projectRecord) {
        const data = projectRecord as Omit<ProjectData, "id">;
        const projectData: ProjectData = {
          id: projectRecord.projectId,
          projectId: projectRecord.projectId,
          title: data.title || "",
          description: data.description,
          enableImageUpload: data.enableImageUpload || false,
          enableGoogleStreetView: data.enableGoogleStreetView || false,
          images: data.images || [],
        };

        setProject(projectData);
        setEditedTitle(projectData.title);
        setEnableImageUpload(projectData.enableImageUpload ?? true);
        setEnableStreetView(projectData.enableGoogleStreetView ?? true);
        setImages(projectData.images || []);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleTitleUpdate = useCallback(async () => {
    if (!editedTitle.trim() || !project || !organizationId || !projectId)
      return;

    try {
      await updateProject(organizationId, projectId, { title: editedTitle });

      setProject({ ...project, title: editedTitle });
      setIsTitleEditing(false);
    } catch (error) {
      console.error("Error updating project title:", error);
    }
  }, [editedTitle, project, organizationId, projectId]);

  const handleToggleChange = useCallback(
    async (
      field: "enableImageUpload" | "enableGoogleStreetView",
      value: boolean,
    ) => {
      if (!project || !organizationId || !projectId) return;

      try {
        await updateProject(organizationId, projectId, { [field]: value });

        if (field === "enableImageUpload") {
          setEnableImageUpload(value);
          setProject({ ...project, enableImageUpload: value });
        } else {
          setEnableStreetView(value);
          setProject({ ...project, enableGoogleStreetView: value });
        }
      } catch (error) {
        console.error("Error updating project:", error);
      }
    },
    [project, organizationId, projectId],
  );

  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || !project || !organizationId || !projectId) return;

      setUploading(true);
      try {
        const uploadPromises = [];

        const convertHeicToJpeg = async (file: File): Promise<File> => {
          // HEIC files are natively supported by modern browsers and Firebase
          // Just return the file as-is for upload
          if (
            file.type === "image/heic" ||
            file.type === "image/heif" ||
            file.name.toLowerCase().endsWith(".heic") ||
            file.name.toLowerCase().endsWith(".heif")
          ) {
            console.log("HEIC file detected, uploading as-is:", file.name);
          }
          return file;
        };

        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          uploadPromises.push(
            (async () => {
              const processedFile = await convertHeicToJpeg(file);
              const storageRef = ref(
                storage,
                `projects/${organizationId}/${projectId}/${Date.now()}-${processedFile.name}`,
              );

              return uploadBytes(storageRef, processedFile)
                .then((snapshot) => getDownloadURL(snapshot.ref))
                .then((downloadURL) => ({
                  id: `img-${Date.now()}-${i}`,
                  url: downloadURL,
                  caption: "",
                }));
            })(),
          );
        }

        Promise.all(uploadPromises)
          .then((newImages) => {
            const updatedImages = [...images, ...newImages];
            setImages(updatedImages);

            return updateProject(organizationId, projectId, {
              images: updatedImages,
            });
          })
          .catch((error) => {
            console.error("Error uploading images:", error);
          })
          .finally(() => {
            setUploading(false);
          });

        event.target.value = "";
      } catch (error) {
        console.error("Error uploading images:", error);
        setUploading(false);
      }
    },
    [project, organizationId, projectId, images],
  );

  const handleImageCaptionUpdate = useCallback(
    (imageId: string, caption: string) => {
      if (!organizationId || !projectId) return;

      const updatedImages = images.map((img) =>
        img.id === imageId ? { ...img, caption } : img,
      );
      setImages(updatedImages);

      updateProject(organizationId, projectId, { images: updatedImages }).catch(
        (error) => {
        console.error("Error updating image caption:", error);
      });
    },
    [organizationId, projectId, images],
  );

  const handleDeleteImage = useCallback(
    (imageId: string) => {
      if (!organizationId || !projectId) return;

      const updatedImages = images.filter((img) => img.id !== imageId);
      setImages(updatedImages);

      updateProject(organizationId, projectId, { images: updatedImages }).catch(
        (error) => {
        console.error("Error deleting image:", error);
      });
    },
    [organizationId, projectId, images],
  );

  const generateInviteLink = useCallback(() => {
    const inviteLink = `${window.location.origin}/${projectId}`;
    return inviteLink;
  }, [projectId]);

  const handleOpenInviteModal = useCallback(() => {
    setIsInviteModalOpen(true);
    const inviteLink = generateInviteLink();

    // Wait for the canvas to be rendered
    setTimeout(async () => {
      try {
        const canvas = qrCanvasRef.current;
        if (canvas) {
          await QRCode.toCanvas(canvas, inviteLink, {
            width: 300,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#ffffff",
            },
          });
          const qrImage = canvas.toDataURL("image/png");
          setQrCode(qrImage);
        }
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    }, 100);
  }, [generateInviteLink]);

  const handleCopyLink = useCallback(() => {
    const inviteLink = generateInviteLink();
    if (inviteLinkRef.current) {
      inviteLinkRef.current.value = inviteLink;
      inviteLinkRef.current.select();
      document.execCommand("copy");
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [generateInviteLink]);

  const handleDeleteProject = useCallback(async () => {
    if (!project || !organizationId || !projectId) return;

    setIsDeleting(true);
    try {
      await deleteProject(organizationId, projectId);
      navigate(`/organizations/${organizationId}/projects`);
    } catch (error) {
      console.error("Error deleting project:", error);
      setIsDeleting(false);
    }
  }, [project, organizationId, projectId, navigate]);

  const { displayDiscardModal } = useDiscardModal();

  const handleOpenDeleteModal = useCallback(() => {
    displayDiscardModal({
      title: t("admin.pages.projectPage.deleteTitle"),
      description: t("admin.pages.projectPage.deleteDescription"),
      submitText: t("admin.pages.projectPage.deleteButton"),
      onSubmit: handleDeleteProject,
    });
  }, [displayDiscardModal, handleDeleteProject, t]);

  if (!organizationId || !projectId) {
    return <div>{t("admin.pages.projectPage.notFound")}</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-screen">
      <Header
        handleBack={() => navigate(`/organizations/${organizationId}/projects`)}
        title={t("admin.pages.projectPage.title")}
      />
      <div className="flex justify-center px-4 pt-4 mx-auto">
        <div className="w-full max-w-4xl mx-auto">
          {/* Header */}

          <div className="">
            {/* Top Right Delete Button */}
            <Button
              onClick={handleOpenDeleteModal}
              disabled={isDeleting}
              leadingIcon="trash"
              variant="outline"
              critical
              className="absolute top-5 right-4"
            />

            {/* Title Section */}
            <div
              className={cn(
                "flex gap-5 justify-between",
                isMobile && "flex-col",
              )}
            >
              <div className="flex items-center  w-full">
                {isTitleEditing ? (
                  <div className="flex gap-2 flex-1 items-center">
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      placeholder={t(
                        "admin.pages.projectPage.titleInputPlaceholder",
                      )}
                      className="flex-1"
                    />

                    <Button
                      variant="outline"
                      leadingIcon="x-md"
                      onClick={() => {
                        setEditedTitle(project?.title || "");
                        setIsTitleEditing(false);
                      }}
                    />
                    <Button
                      variant="primary"
                      leadingIcon="checkmark-md"
                      onClick={() => handleTitleUpdate()}
                      disabled={!editedTitle.trim() || loading}
                    />
                  </div>
                ) : (
                  <div className="flex gap-3 items-center flex-1  w-full">
                    <div className="flex items-center gap-2 rounded-lg border-2 border-gray-900 pl-4 pr-2 py-2 flex-1 w-full justify-between">
                      <p className="text-gray-900 font-medium">
                        {project?.title}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsTitleEditing(true)}
                        leadingIcon="edit"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Toggles Section */}
              <div className="flex gap-6 border-2 border-gray-900 rounded-lg p-4 h-12 min-w-[510px]">
                <Toggle
                  label={t("admin.pages.projectPage.uploadLabel")}
                  checked={enableImageUpload}
                  onChange={(e) =>
                    handleToggleChange("enableImageUpload", e.target.checked)
                  }
                />
                <Toggle
                  label={t("admin.pages.projectPage.streetViewLabel")}
                  checked={enableStreetView}
                  onChange={(e) =>
                    handleToggleChange(
                      "enableGoogleStreetView",
                      e.target.checked,
                    )
                  }
                />
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div>
            {/* Upload Section and Image Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-10">
              {/* Upload Button */}
              <label className="rounded-lg border-2 border-gray-300 border-dashed bg-white p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors min-h-[180px]">
                <input
                  type="file"
                  multiple
                  accept="image/*,.heic,.heif"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <ImagePlus className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 text-center">
                  {uploading
                    ? t("admin.pages.projectPage.uploading")
                    : t("admin.pages.projectPage.uploadButton")}
                </span>
              </label>

              {/* Image Cards */}
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative rounded-lg border-2 border-gray-300 overflow-hidden bg-white flex flex-col"
                >
                  <Button
                    onClick={() => handleDeleteImage(image.id)}
                    leadingIcon="trash"
                    variant="white"
                    classNameWrapper="top-3 right-3 absolute"
                    size="sm"
                    critical
                  />
                  <img
                    src={image.url}
                    alt={image.caption}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-3 flex-1 flex flex-col gap-2">
                    <input
                      type="text"
                      value={image.caption}
                      onChange={(e) =>
                        handleImageCaptionUpdate(image.id, e.target.value)
                      }
                      placeholder={t("admin.pages.projectPage.imageCaption")}
                      className="text-md text-gray-700 border-none outline-none focus:ring-0 p-0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
