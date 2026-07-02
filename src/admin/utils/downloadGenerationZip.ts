import JSZip from "jszip";
import type { Generation } from "@/aiImageGenerator/types";
import { getSession, listSessionGenerationsOrdered } from "@/lib/dataAccess";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

const fetchImageBlob = async (url: string): Promise<Blob> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${url}`);
  }
  return response.blob();
};

const getExtensionFromUrl = (url: string): string => {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split(".").pop()?.split("?")[0]?.toLowerCase();
    if (ext && IMAGE_EXTENSIONS.has(ext)) {
      return ext === "jpeg" ? "jpg" : ext;
    }
  } catch {
    // fall through
  }
  return "jpg";
};

const slugify = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

export async function downloadGenerationImagesAsZip(
  generation: Generation & { id: string },
): Promise<void> {
  const { organizationId, projectId, sessionId, id: generationId } = generation;

  const [sessionDoc, sessionGenerations] = await Promise.all([
    getSession(organizationId, projectId, sessionId),
    listSessionGenerationsOrdered(
      organizationId,
      projectId,
      sessionId,
      "asc",
    ),
  ]);

  const validGenerations = sessionGenerations.filter(
    (entry): entry is Record<string, unknown> & {
      generationId: string;
      image: { url: string };
    } =>
      typeof entry.generationId === "string" &&
      typeof entry.image === "object" &&
      entry.image !== null &&
      typeof (entry.image as { url?: unknown }).url === "string" &&
      Boolean((entry.image as { url: string }).url),
  );

  const selectedIndex = validGenerations.findIndex(
    (entry) => entry.generationId === generationId,
  );
  const processGenerations =
    selectedIndex >= 0
      ? validGenerations.slice(0, selectedIndex + 1)
      : validGenerations;

  const originalUrl =
    (sessionDoc?.originalImage as { url?: string } | undefined)?.url ?? null;

  const zip = new JSZip();
  let fileIndex = 1;

  if (originalUrl) {
    const blob = await fetchImageBlob(originalUrl);
    zip.file(
      `${String(fileIndex).padStart(2, "0")}-original.${getExtensionFromUrl(originalUrl)}`,
      blob,
    );
    fileIndex += 1;
  }

  for (let stepIndex = 0; stepIndex < processGenerations.length; stepIndex += 1) {
    const entry = processGenerations[stepIndex];
    const url = entry.image.url;
    const blob = await fetchImageBlob(url);
    const isFinal = stepIndex === processGenerations.length - 1;
    const label = isFinal ? "final" : `step-${stepIndex + 1}`;

    zip.file(
      `${String(fileIndex).padStart(2, "0")}-${label}.${getExtensionFromUrl(url)}`,
      blob,
    );
    fileIndex += 1;
  }

  if (fileIndex === 1) {
    throw new Error("No images found for download");
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const objectUrl = window.URL.createObjectURL(zipBlob);
  const link = document.createElement("a");
  link.href = objectUrl;

  const dateStamp = new Date().toISOString().split("T")[0];
  const nameBase = generation.title ? slugify(generation.title) : generationId;
  link.download = `${nameBase || "generation"}-${dateStamp}.zip`;

  link.click();
  window.URL.revokeObjectURL(objectUrl);
}
