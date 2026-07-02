import { useCallback, useEffect, useRef, useState } from "react";
import {
  listSessionGenerationsPage,
  subscribeLatestSessionGeneration,
} from "@/lib/dataAccess";
import { PERSISTENT_STORAGE, SESSION_STORAGE } from "../constants/storageKeys";
import { useUser } from "../context/userContext";
import type { Generation } from "../types";

interface LibraryItem extends Generation {}

const useFetchLibrary = () => {
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [errorInLibrary, setError] = useState<unknown | null>(null);
  const isFetchingRef = useRef(false);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [hasMorePages, setHasMorePages] = useState(true);
  const lastVisible = useRef<unknown | null>(null);
  const { userId } = useUser();

  const [organizationId, setOrganizationId] = useState<string | null>(() =>
    localStorage.getItem(PERSISTENT_STORAGE.ORGANIZATION_ID),
  );
  const [projectId, setProjectId] = useState<string | null>(() =>
    localStorage.getItem(PERSISTENT_STORAGE.PROJECT_ID),
  );
  const [sessionId, setSessionId] = useState<string | null>(() =>
    sessionStorage.getItem(SESSION_STORAGE.SESSION_ID),
  );

  useEffect(() => {
    const syncStorage = () => {
      setOrganizationId(
        localStorage.getItem(PERSISTENT_STORAGE.ORGANIZATION_ID),
      );
      setProjectId(localStorage.getItem(PERSISTENT_STORAGE.PROJECT_ID));
      setSessionId(sessionStorage.getItem(SESSION_STORAGE.SESSION_ID));
    };

    syncStorage();
    window.addEventListener("storage", syncStorage);
    return () => window.removeEventListener("storage", syncStorage);
  }, []);

  useEffect(() => {
    console.log("useFetchLibrary: identifiers =", {
      organizationId,
      projectId,
      sessionId,
    });
  }, [organizationId, projectId, sessionId]);

  useEffect(() => {
    console.log("useFetchLibrary: session changed, resetting library");
    setLibrary([]);
    lastVisible.current = null;
    setHasMorePages(true);
  }, [sessionId]);

  const refreshLibrary = useCallback(async () => {
    if (!organizationId || !projectId || !sessionId) return;

    setLoadingLibrary(true);
    lastVisible.current = null;

    try {
      const page = await listSessionGenerationsPage(
        organizationId,
        projectId,
        sessionId,
        { pageSize: 4 },
      );
      const newGenerations = page.generations.map(
        (generation) =>
          ({
            ...generation,
            id: generation.generationId,
          }) as Generation,
      );
      setLibrary(newGenerations);
      lastVisible.current = page.cursor;
      setHasMorePages(page.hasMore);
    } catch (error) {
      console.error("Error refreshing library:", error);
      setError(error);
    } finally {
      setLoadingLibrary(false);
    }
  }, [organizationId, projectId, sessionId]);

  const fetchLibrary = useCallback(async () => {
    const itemsPerPage = 4;
    if (
      !organizationId ||
      !projectId ||
      !sessionId ||
      isFetchingRef.current ||
      !hasMorePages
    ) {
      return;
    }

    isFetchingRef.current = true;
    setLoadingLibrary(true);

    try {
      const page = await listSessionGenerationsPage(
        organizationId,
        projectId,
        sessionId,
        {
          pageSize: itemsPerPage,
          cursor: lastVisible.current ?? undefined,
        },
      );
      const newGenerations = page.generations.map(
        (generation) =>
          ({
            ...generation,
            id: generation.generationId,
          }) as Generation,
      );

      setLibrary((prevGenerations) => [...prevGenerations, ...newGenerations]);
      lastVisible.current = page.cursor;
      setHasMorePages(page.hasMore);
    } catch (error) {
      console.error("Error fetching library:", error);
      setError(error);
    } finally {
      setLoadingLibrary(false);
      isFetchingRef.current = false;
    }
  }, [organizationId, projectId, sessionId, hasMorePages]);

  useEffect(() => {
    if (!organizationId || !projectId || !sessionId) return;

    const unsubscribe = subscribeLatestSessionGeneration(
      organizationId,
      projectId,
      sessionId,
      (generation) => {
        const newGeneration = {
          ...generation,
          id: generation.generationId,
        } as Generation;

        setLibrary((prevLibrary) => {
          const exists = prevLibrary.some((item) => item.id === newGeneration.id);
          if (exists) return prevLibrary;
          return [newGeneration, ...prevLibrary];
        });
      },
      (error) => {
        console.error("Error in real-time updates:", error);
        setError(error);
      },
    );

    return () => unsubscribe();
  }, [organizationId, projectId, sessionId]);

  return {
    loadingLibrary,
    library,
    errorInLibrary,
    fetchLibrary,
    hasMorePages,
    refreshLibrary,
  };
};

export default useFetchLibrary;
