import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  startAfter,
  updateDoc,
  where,
  type QueryDocumentSnapshot,
} from "firebase/firestore/lite";
import {
  collection as fullCollection,
  limit as realtimeLimit,
  onSnapshot,
  orderBy as realtimeOrderBy,
  query as realtimeQuery,
} from "firebase/firestore";
import { db, fullDb } from "../firebase";

export async function getUtopiaGeneral(): Promise<Record<string, unknown> | null> {
  const snapshot = await getDoc(doc(db, "utopia/general"));
  if (!snapshot.exists()) return null;
  return snapshot.data();
}

export async function updateUtopiaGeneral(
  data: Record<string, unknown>,
): Promise<void> {
  await setDoc(doc(db, "utopia/general"), data, { merge: true });
}

export async function updateUtopiaLastRequest(
  data: Record<string, unknown>,
): Promise<void> {
  await setDoc(doc(db, "utopia/lastRequest"), data, { merge: true });
}

export async function listUtopiaRequestsByUser(
  userId: string,
): Promise<Record<string, unknown>[]> {
  const snapshot = await getDocs(
    query(
      collection(db, "utopia/general/requests"),
      where("userId", "==", userId),
    ),
  );
  return snapshot.docs.map((requestDoc) => ({
    requestId: requestDoc.id,
    ...requestDoc.data(),
  }));
}

export async function getSession(
  organizationId: string,
  projectId: string,
  sessionId: string,
): Promise<Record<string, unknown> | null> {
  const snapshot = await getDoc(
    doc(
      db,
      `organizations/${organizationId}/projects/${projectId}/sessions/${sessionId}`,
    ),
  );
  if (!snapshot.exists()) return null;
  return { sessionId, ...snapshot.data() };
}

export async function listGenerations(
  organizationId: string,
  projectId: string,
  sessionId: string,
): Promise<Record<string, unknown>[]> {
  const snapshot = await getDocs(
    collection(
      db,
      `organizations/${organizationId}/projects/${projectId}/sessions/${sessionId}/generations`,
    ),
  );
  return snapshot.docs.map((generationDoc) => ({
    generationId: generationDoc.id,
    ...generationDoc.data(),
  }));
}

export async function getGeneration(
  organizationId: string,
  projectId: string,
  sessionId: string,
  generationId: string,
): Promise<Record<string, unknown> | null> {
  const snapshot = await getDoc(
    doc(
      db,
      `organizations/${organizationId}/projects/${projectId}/sessions/${sessionId}/generations/${generationId}`,
    ),
  );
  if (!snapshot.exists()) return null;
  return { generationId, ...snapshot.data() };
}

export async function insertGeneration(
  organizationId: string,
  projectId: string,
  sessionId: string,
  generationId: string,
  data: Record<string, unknown>,
): Promise<void> {
  await setDoc(
    doc(
      collection(
        db,
        `organizations/${organizationId}/projects/${projectId}/sessions/${sessionId}/generations`,
      ),
      generationId,
    ),
    data,
  );
}

export async function updateGeneration(
  organizationId: string,
  projectId: string,
  sessionId: string,
  generationId: string,
  data: Record<string, unknown>,
): Promise<void> {
  await setDoc(
    doc(
      db,
      `organizations/${organizationId}/projects/${projectId}/sessions/${sessionId}/generations/${generationId}`,
    ),
    data,
    { merge: true },
  );
}

export async function insertSession(
  organizationId: string,
  projectId: string,
  sessionId: string,
  data: Record<string, unknown>,
): Promise<void> {
  await setDoc(
    doc(
      db,
      `organizations/${organizationId}/projects/${projectId}/sessions/${sessionId}`,
    ),
    data,
  );
}

export async function listUtopiaCategories(): Promise<Record<string, unknown>[]> {
  const snapshot = await getDocs(collection(db, "utopia/general/categories"));
  return snapshot.docs.map((categoryDoc) => ({
    categoryId: categoryDoc.id,
    ...categoryDoc.data(),
  }));
}

export async function updateUtopiaModel(
  modelId: string,
  data: Record<string, unknown>,
): Promise<void> {
  await setDoc(doc(db, `utopia/general/models/${modelId}`), data, {
    merge: true,
  });
}

export async function updateUtopiaCategory(
  categoryId: string,
  data: Record<string, unknown>,
): Promise<void> {
  await setDoc(doc(db, `utopia/general/categories/${categoryId}`), data, {
    merge: true,
  });
}

export async function listModels(): Promise<Record<string, unknown>[]> {
  const snapshot = await getDocs(collection(db, "utopia/general/models"));
  return snapshot.docs.map((modelDoc) => ({
    modelId: modelDoc.id,
    ...modelDoc.data(),
  }));
}

export async function insertUtopiaCategory(
  categoryId: string,
  data: Record<string, unknown>,
): Promise<void> {
  await setDoc(doc(db, `utopia/general/categories/${categoryId}`), data);
}

export async function insertUtopiaModel(
  modelId: string,
  data: Record<string, unknown>,
): Promise<void> {
  await setDoc(doc(db, `utopia/general/models/${modelId}`), data);
}

export async function deleteUtopiaModel(modelId: string): Promise<void> {
  await deleteDoc(doc(db, `utopia/general/models/${modelId}`));
}

export async function deleteUtopiaCategory(categoryId: string): Promise<void> {
  await deleteDoc(doc(db, `utopia/general/categories/${categoryId}`));
}

export async function setDocumentAtCollectionPath(
  collectionPath: string,
  documentId: string,
  data: Record<string, unknown>,
): Promise<void> {
  await setDoc(doc(db, collectionPath, documentId), data);
}

export async function patchDocumentAtCollectionPath(
  collectionPath: string,
  documentId: string,
  data: Record<string, unknown>,
): Promise<void> {
  await updateDoc(doc(db, collectionPath, documentId), data);
}

export async function listUtopiaRequestsPage(options?: {
  pageSize?: number;
  cursor?: unknown;
}): Promise<{
  requests: Record<string, unknown>[];
  cursor: unknown | null;
  hasMore: boolean;
}> {
  const pageSize = options?.pageSize ?? 100;
  const requestsRef = collection(db, "utopia/general/requests");
  let requestsQuery = query(
    requestsRef,
    orderBy("createdAt", "desc"),
    limit(pageSize),
  );
  if (options?.cursor) {
    requestsQuery = query(
      requestsRef,
      orderBy("createdAt", "desc"),
      startAfter(options.cursor as QueryDocumentSnapshot),
      limit(pageSize),
    );
  }
  const snapshot = await getDocs(requestsQuery);
  return {
    requests: snapshot.docs.map((requestDoc) => ({
      requestId: requestDoc.id,
      ...requestDoc.data(),
    })),
    cursor: snapshot.docs[snapshot.docs.length - 1] ?? null,
    hasMore: snapshot.docs.length === pageSize,
  };
}

export async function listSessionGenerationsPage(
  organizationId: string,
  projectId: string,
  sessionId: string,
  options?: { pageSize?: number; cursor?: unknown },
): Promise<{
  generations: Record<string, unknown>[];
  cursor: unknown | null;
  hasMore: boolean;
}> {
  const pageSize = options?.pageSize ?? 4;
  const generationsRef = collection(
    db,
    `organizations/${organizationId}/projects/${projectId}/sessions/${sessionId}/generations`,
  );
  let generationsQuery = query(
    generationsRef,
    orderBy("createdAt", "desc"),
    limit(pageSize + 1),
  );
  if (options?.cursor) {
    generationsQuery = query(
      generationsRef,
      orderBy("createdAt", "desc"),
      startAfter(options.cursor as QueryDocumentSnapshot),
      limit(pageSize + 1),
    );
  }
  const snapshot = await getDocs(generationsQuery);
  const docs = snapshot.docs.slice(0, pageSize);
  return {
    generations: docs.map((generationDoc) => ({
      generationId: generationDoc.id,
      ...generationDoc.data(),
    })),
    cursor: docs[docs.length - 1] ?? null,
    hasMore: snapshot.docs.length > pageSize,
  };
}

export function subscribeLatestSessionGeneration(
  organizationId: string,
  projectId: string,
  sessionId: string,
  onAdded: (generation: Record<string, unknown>) => void,
  onError?: (error: Error) => void,
): () => void {
  const generationsRef = fullCollection(
    fullDb,
    `organizations/${organizationId}/projects/${projectId}/sessions/${sessionId}/generations`,
  );
  const generationsQuery = realtimeQuery(
    generationsRef,
    realtimeOrderBy("createdAt", "desc"),
    realtimeLimit(1),
  );
  return onSnapshot(
    generationsQuery,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          onAdded({
            generationId: change.doc.id,
            ...change.doc.data(),
          });
        }
      });
    },
    onError,
  );
}

export async function listProjectGenerationsPage(
  organizationId: string,
  projectId: string,
  options?: { pageSize?: number; cursor?: unknown },
): Promise<{
  generations: Record<string, unknown>[];
  cursor: unknown | null;
  hasMore: boolean;
}> {
  const pageSize = options?.pageSize ?? 20;
  const generationsRef = collectionGroup(db, "generations");
  let generationsQuery = query(
    generationsRef,
    where("organizationId", "==", organizationId),
    where("projectId", "==", projectId),
    orderBy("createdAt", "desc"),
    limit(pageSize),
  );
  if (options?.cursor) {
    generationsQuery = query(
      generationsRef,
      where("organizationId", "==", organizationId),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc"),
      startAfter(options.cursor as QueryDocumentSnapshot),
      limit(pageSize),
    );
  }
  const snapshot = await getDocs(generationsQuery);
  return {
    generations: snapshot.docs.map((generationDoc) => ({
      generationId: generationDoc.id,
      ...generationDoc.data(),
    })),
    cursor: snapshot.docs[snapshot.docs.length - 1] ?? null,
    hasMore: snapshot.docs.length === pageSize,
  };
}

export async function listSessionsByUser(
  organizationId: string,
  projectId: string,
  userId: string,
): Promise<Record<string, unknown>[]> {
  const snapshot = await getDocs(
    query(
      collection(
        db,
        `organizations/${organizationId}/projects/${projectId}/sessions`,
      ),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    ),
  );
  return snapshot.docs.map((sessionDoc) => ({
    sessionId: sessionDoc.id,
    ...sessionDoc.data(),
  }));
}

export async function findProjectAcrossOrganizations(
  projectId: string,
): Promise<{ organizationId: string; project: Record<string, unknown> } | null> {
  const organizationsSnapshot = await getDocs(collection(db, "organizations"));
  for (const organizationDoc of organizationsSnapshot.docs) {
    const projectSnapshot = await getDoc(
      doc(organizationDoc.ref, "projects", projectId),
    );
    if (projectSnapshot.exists()) {
      return {
        organizationId: organizationDoc.id,
        project: projectSnapshot.data(),
      };
    }
  }
  return null;
}

export async function listFinishedProjectGenerations(
  organizationId: string,
  projectId: string,
): Promise<Record<string, unknown>[]> {
  const snapshot = await getDocs(
    query(
      collectionGroup(db, "generations"),
      where("organizationId", "==", organizationId),
      where("projectId", "==", projectId),
      where("finished", "==", true),
      orderBy("createdAt", "desc"),
    ),
  );
  return snapshot.docs.map((generationDoc) => ({
    generationId: generationDoc.id,
    ...generationDoc.data(),
  }));
}

export async function listSessionGenerationsOrdered(
  organizationId: string,
  projectId: string,
  sessionId: string,
  direction: "asc" | "desc" = "asc",
): Promise<Record<string, unknown>[]> {
  const snapshot = await getDocs(
    query(
      collection(
        db,
        `organizations/${organizationId}/projects/${projectId}/sessions/${sessionId}/generations`,
      ),
      orderBy("createdAt", direction),
    ),
  );
  return snapshot.docs.map((generationDoc) => ({
    generationId: generationDoc.id,
    ...generationDoc.data(),
  }));
}
