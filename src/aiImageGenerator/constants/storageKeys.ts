// Persistent across browser sessions (localStorage)
export const PERSISTENT_STORAGE = {
  USER_ID: "user_id",
  ORGANIZATION_ID: "org_id",
  PROJECT_ID: "project_id",
  START_IMAGE_ID: "start_image_id",
  START_IMAGE_URL: "start_image_url",
} as const;

// Current session only (sessionStorage)
export const SESSION_STORAGE = {
  SESSION_ID: "session_id",
  SELECTED_IMAGE: "selected_image",
} as const;

// Type helpers
export type PersistentStorageKey = keyof typeof PERSISTENT_STORAGE;
export type SessionStorageKey = keyof typeof SESSION_STORAGE;
