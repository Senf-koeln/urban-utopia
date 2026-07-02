/**
 * Urban Utopia Firebase — always urban-utopia-bc48d.
 * Ignores stale Firebase config on localhost from other local apps.
 */
import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore as getFullFirestore } from "firebase/firestore";
import { getFirestore } from "firebase/firestore/lite";
import { getStorage } from "firebase/storage";

const UTOPIA_PROJECT_ID = "urban-utopia-bc48d";
const UTOPIA_FIREBASE_APP_NAME = UTOPIA_PROJECT_ID;

const UTOPIA_FIREBASE_CONFIG = {
  authDomain: "urban-utopia-bc48d.firebaseapp.com",
  projectId: UTOPIA_PROJECT_ID,
  storageBucket: "urban-utopia-bc48d.firebasestorage.app",
  apiKey: "",
  messagingSenderId: "",
  appId: "",
} as const;

function readEnv(key: string): string {
  const value = import.meta.env[key];
  if (typeof value !== "string") return "";
  return value.trim().replace(/^["']|["']$/g, "");
}

function buildFirebaseConfig() {
  const fromEnv = {
    apiKey: readEnv("VITE_FIREBASE_API_KEY"),
    authDomain: readEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: readEnv("VITE_FIREBASE_PROJECTID"),
    storageBucket: readEnv("VITE_FIREBASE_STORAGEBUCKET"),
    messagingSenderId: readEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: readEnv("VITE_FIREBASE_APP_ID"),
  };

  if (fromEnv.projectId === UTOPIA_PROJECT_ID && fromEnv.apiKey) {
    return {
      ...UTOPIA_FIREBASE_CONFIG,
      ...Object.fromEntries(
        Object.entries(fromEnv).filter(([, value]) => value.length > 0),
      ),
    };
  }

  if (!fromEnv.apiKey || fromEnv.projectId !== UTOPIA_PROJECT_ID) {
    throw new Error(
      "[urban-utopia] Set VITE_FIREBASE_* in .env (see .env.example).",
    );
  }

  return {
    ...UTOPIA_FIREBASE_CONFIG,
    ...Object.fromEntries(
      Object.entries(fromEnv).filter(([, value]) => value.length > 0),
    ),
  };
}

const firebaseConfig = buildFirebaseConfig();

const existingUtopiaApp = getApps().find(
  (app) =>
    app.name === UTOPIA_FIREBASE_APP_NAME &&
    app.options.projectId === UTOPIA_PROJECT_ID,
);

const firebaseApp =
  existingUtopiaApp ??
  initializeApp(firebaseConfig, UTOPIA_FIREBASE_APP_NAME);

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const fullDb = getFullFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

const regionDbs = [{ region: "eu" as const, db }];

/** Optional Cloud Functions base URL for legacy Replicate inpainting. */
export function getCloudFunctionUrl(baseName: string): string {
  const base = readEnv("VITE_FIREBASE_CLOUD_FUNCTIONS_URL").replace(/\/+$/, "");
  if (!base) {
    throw new Error(
      "[urban-utopia] VITE_FIREBASE_CLOUD_FUNCTIONS_URL is required.",
    );
  }
  return `${base}/${baseName}`;
}

export function getCurrentRegion(): "eu" {
  return "eu";
}

export function setDataRegion(): void {}

export function getRegionReady(): boolean {
  return true;
}

export function subscribeToRegion(): () => void {
  return () => {};
}

export function subscribeToRegionChange(): () => void {
  return () => {};
}

export function getRegionSnapshot(): string {
  return "eu";
}

export default firebaseApp;
export { auth, db, fullDb, firebaseConfig, storage, regionDbs };
