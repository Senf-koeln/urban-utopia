import dayjs from "dayjs";
import { Calendar, Check, Copy, Loader2 } from "lucide-react";
// @ts-expect-error - qrcode module lacks type definitions
import QRCode from "qrcode";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@ui/components/core/button/Button";
import {
  generateBase62Id,
  insertProject,
  listProjectsByCreatedAtDesc,
} from "@/lib/dataAccess";
import TopBar from "@/aiImageGenerator/components/TopBar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Project {
  id: string;
  title: string;
  logoURL?: string;
  createdAt: string;
  projectId: string;
}

const formatListDate = (value: unknown): string => {
  if (typeof value === "string" && value) {
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format("DD.MM.YYYY") : "";
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return dayjs((value as { toDate: () => Date }).toDate()).format(
      "DD.MM.YYYY",
    );
  }

  return "";
};

interface AddProjectModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  organizationId: string;
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
  organizationId,
}) => {
  const { t } = useTranslation();
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!projectName.trim()) return;

    setLoading(true);
    try {
      const projectId = generateBase62Id();
      const newProject = {
        projectId,
        title: projectName,
        createdAt: new Date().toISOString(),
        status: "active",
        logoURL: null,
      };

      await insertProject(organizationId, projectId, newProject);

      onSuccess();
      setProjectName("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!loading) {
      setProjectName("");
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("admin.pages.projectModal.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="project-name"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t("admin.pages.projectModal.label")}
            </label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={t("admin.pages.projectModal.placeholder")}
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            {t("admin.pages.projectModal.cancelButton")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!projectName.trim() || loading}
            loading={loading}
          >
            {loading
              ? t("admin.pages.projectModal.creatingButton")
              : t("admin.pages.projectModal.createButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ProjectsPage: React.FC = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const inviteLinkRef = React.useRef<HTMLInputElement>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const qrCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const [selectedProjectTitle, setSelectedProjectTitle] = useState<string>("");

  if (!organizationId) {
    return <div>{t("admin.pages.adminPage.organizationNotFound")}</div>;
  }

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const projects = await listProjectsByCreatedAtDesc(organizationId);
      const data: Project[] = projects.map((project) => ({
        id: project.projectId,
        projectId: project.projectId,
        title: typeof project.title === "string" ? project.title : "",
        logoURL:
          typeof project.logoURL === "string" ? project.logoURL : undefined,
        createdAt: formatListDate(project.createdAt),
      }));
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleProjectClick = (projectId: string) => {
    navigate(`/organizations/${organizationId}/projects/${projectId}`);
  };

  const generateInviteLink = useCallback((projectId: string) => {
    const inviteLink = `${window.location.origin}/${projectId}`;
    return inviteLink;
  }, []);

  const handleOpenInviteModal = useCallback(
    (projectId: string) => {
      setSelectedProjectId(projectId);
      const project = projects.find((p) => p.projectId === projectId);
      setSelectedProjectTitle(project?.title || "");
      setIsInviteModalOpen(true);
      const inviteLink = generateInviteLink(projectId);

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
    },
    [generateInviteLink, projects],
  );

  const handleCopyLink = useCallback(() => {
    if (selectedProjectId) {
      const inviteLink = generateInviteLink(selectedProjectId);
      if (inviteLinkRef.current) {
        inviteLinkRef.current.value = inviteLink;
        inviteLinkRef.current.select();
        document.execCommand("copy");
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    }
  }, [selectedProjectId, generateInviteLink]);

  return (
    <div className="min-h-screen bg-gray-50 w-screen">
      <TopBar />
      <div className="flex justify-center px-4 py-8 sm:py-12 mx-auto ">
        <div className="w-full max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12 flex items-center justify-between">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              {t("admin.pages.projectsPage.title")}
            </h1>
            <Button
              onClick={() => setIsModalOpen(true)}
              leadingIcon="plus-md"
              variant="primary"
            >
              {t("admin.pages.projectsPage.createButton")}
            </Button>
          </div>

          {/* Modal */}
          <AddProjectModal
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
            onSuccess={fetchProjects}
            organizationId={organizationId}
          />

          {/* Projects List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center">
                <p className="text-gray-500">
                  {t("admin.pages.projectsPage.noSessions")}
                </p>
              </div>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-gray-900 bg-white p-6 transition-all"
                >
                  <div className="flex flex-1 items-start gap-6">
                    {/* Logo/Avatar */}
                    <div className="flex-shrink-0">
                      {project.logoURL ? (
                        <img
                          src={project.logoURL}
                          alt={project.title}
                          className="h-16 w-16 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-200 text-xl font-semibold text-gray-700">
                          {project.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {project.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{project.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-shrink-0 gap-3">
                    <Button
                      onClick={() => handleProjectClick(project.projectId)}
                    >
                      {t("admin.pages.projectsPageButtons.editButton")}
                    </Button>
                    <Button
                      onClick={() =>
                        navigate(
                          `/organizations/${organizationId}/projects/${project.projectId}/results`,
                        )
                      }
                    >
                      {t("admin.pages.projectsPageButtons.resultsButton")}
                    </Button>

                    <Button
                      variant="outline"
                      text={t("admin.pages.projectsPageButtons.inviteButton")}
                      onClick={() => handleOpenInviteModal(project.projectId)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Invite Modal */}
          <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {t("admin.pages.inviteModal.title", {
                    projectName: selectedProjectTitle,
                  })}
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col items-center gap-6 py-4">
                {/* QR Code */}
                <div className="flex items-center justify-center bg-white p-6 rounded-lg border-2 border-gray-200">
                  <canvas ref={qrCanvasRef} style={{ display: "none" }} />
                  {qrCode && (
                    <img
                      src={qrCode}
                      alt="Invite QR Code"
                      className="w-96 h-96 object-contain"
                    />
                  )}
                </div>

                {/* Copy Link Section */}
                <div className="w-full space-y-3">
                  <label htmlFor="invite-link" className="text-sm font-medium">
                    {t("admin.pages.inviteModal.linkLabel")}
                  </label>
                  <div className="flex gap-4 items-center">
                    <Input
                      id="invite-link"
                      ref={inviteLinkRef}
                      readOnly
                      value={
                        selectedProjectId
                          ? `${window.location.origin}/${selectedProjectId}`
                          : ""
                      }
                      className="flex-1 text-sm"
                    />
                    <Button
                      onClick={handleCopyLink}
                      variant="primary"
                      size="lg"
                      className="flex-shrink-0"
                      leadingIcon={isCopied ? "checkmark-md" : "duplicate"}
                    />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;
