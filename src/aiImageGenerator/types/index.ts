export interface ImageResult {
  img: string | null;
  error: string | null;
  status?: string;
  logs?: string;
  generationId?: string;
}

export interface GeminiResponse {
  success?: boolean;
  img: string | null;
  error?: string;
  status?: string;
  logs?: string;
}

export interface FirestoreModel {
  id: string;
  title: string;
  prompt: string;
  keywords?: {
    de: string[];
    en: string[];
  };
  model: string;
  imgURL?: string | null;
  category: string;
  categoryIndex?: number;
}

export interface SelectedObject extends FirestoreModel {
  strength?: number;
  model?: string;
  name?: string;
}

export interface ProjectImage {
  id: string;
  url: string;
  caption: string;
  projectId: string;
}

export interface ProjectData {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  enableImageUpload?: boolean;
  enableGoogleStreetView?: boolean;
  images: ProjectImage[];
}

export interface CreatedImage {
  id: string;
  url: string;
  title?: string;
  projectId?: string;
}

export interface OriginalImage {
  url: string;
  name: string;
  source: "project-gallery" | "file-upload" | "streetview";
  uploadedAt: string;
}

export interface Session {
  originalImage: OriginalImage;
  userId: string;
  projectId: string;
  organizationId: string;
  createdAt: string;
  endedAt?: string;
}

export interface GeneratedImage {
  url: string;
  name: string;
  uploadedAt: string;
}

export interface Generation {
  image: GeneratedImage;
  prompt: string;
  model: "gemini" | "flux" | "stable-diffusion";
  sessionId: string;
  userId: string;
  projectId: string;
  organizationId: string;
  createdAt: string;
  status: "pending" | "complete" | "failed";
  retryCount: number;
  creditsUsed?: number;
  finished?: boolean;
  title?: string;
  id?: string;
}
