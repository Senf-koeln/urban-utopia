import dayjs from "dayjs";
import { Calendar, Loader2 } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Button from "@ui/components/core/button/Button";
import {
  generateBase62Id,
  insertOrganization,
  listOrganizationsOrderedByCreatedAt,
} from "@/lib/dataAccess";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Organization {
  id: string;
  title: string;
  logoURL?: string;
  createdAt: string;
  organizationId: string;
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

interface AddOrganizationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddOrganizationModal: React.FC<AddOrganizationModalProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [organizationName, setOrganizationName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!organizationName.trim()) return;

    setLoading(true);
    try {
      const organizationId = generateBase62Id();
      const newOrganization = {
        organizationId,
        title: organizationName,
        createdAt: new Date().toISOString(),
        status: "active",
        logoURL: null,
        membersCapacity: 100,
        projectCapacity: 100,
        members: [],
      };

      await insertOrganization(organizationId, newOrganization);

      onSuccess();
      setOrganizationName("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating organization:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!loading) {
      setOrganizationName("");
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("admin.pages.organizationModal.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="org-name"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t("admin.pages.organizationModal.label")}
            </label>
            <Input
              id="org-name"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder={t("admin.pages.organizationModal.placeholder")}
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
            {t("admin.pages.organizationModal.cancelButton")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!organizationName.trim() || loading}
            loading={loading}
          >
            {loading
              ? t("admin.pages.organizationModal.creatingButton")
              : t("admin.pages.organizationModal.createButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const organizations = await listOrganizationsOrderedByCreatedAt();
      const data: Organization[] = organizations.map((organization) => ({
        id: organization.organizationId,
        organizationId: organization.organizationId,
        title:
          typeof organization.title === "string" ? organization.title : "",
        logoURL:
          typeof organization.logoURL === "string"
            ? organization.logoURL
            : undefined,
        createdAt: formatListDate(organization.createdAt),
      }));
      setOrganizations(data);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleOrganizationClick = (organizationId: string) => {
    navigate(`/organizations/${organizationId}`);
  };

  return (
    <div className="h-screen w-screen overflow-y-auto bg-gray-50">
      <div className="flex justify-center px-4 py-8 sm:py-12 mx-auto ">
        <div className="w-full max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12 flex items-center justify-between">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              {t("admin.pages.adminPage.title")}
            </h1>
            <Button
              onClick={() => setIsModalOpen(true)}
              leadingIcon="plus-md"
              variant="primary"
            >
              {t("admin.pages.adminPage.createButton")}
            </Button>
          </div>

          {/* Modal */}
          <AddOrganizationModal
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
            onSuccess={fetchOrganizations}
          />

          {/* Sessions List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : organizations.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center">
                <p className="text-gray-500">
                  {t("admin.pages.adminPage.noSessions")}
                </p>
              </div>
            ) : (
              organizations.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between rounded-2xl border-2 border-gray-900 bg-white p-6 transition-all hover:shadow-lg"
                  onClick={() => handleOrganizationClick(org.organizationId)}
                >
                  <div className="flex flex-1 items-start gap-6">
                    {/* Logo/Avatar */}
                    <div className="flex-shrink-0">
                      {org.logoURL ? (
                        <img
                          src={org.logoURL}
                          alt={org.title}
                          className="h-16 w-16 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-200 text-xl font-semibold text-gray-700">
                          {org.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {org.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{org.createdAt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
