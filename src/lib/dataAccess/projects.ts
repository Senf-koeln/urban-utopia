import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore/lite";
import { db } from "../firebase";

export type ProjectDocument = Record<string, unknown> & {
  projectId: string;
  organizationId?: string;
};

export type ProjectWriteInput = Record<string, unknown>;

const projectDocRef = (organizationId: string, projectId: string) =>
  doc(db, `organizations/${organizationId}/projects/${projectId}`);

const toProjectDocument = (
  projectId: string,
  data: Record<string, unknown>,
): ProjectDocument => ({
  projectId,
  ...data,
});

export async function getProject(
  organizationId: string,
  projectId: string,
): Promise<ProjectDocument | null> {
  const snapshot = await getDoc(projectDocRef(organizationId, projectId));
  if (!snapshot.exists()) {
    return null;
  }

  return toProjectDocument(projectId, snapshot.data());
}

export async function listProjectsByCreatedAtDesc(
  organizationId: string,
): Promise<ProjectDocument[]> {
  const snapshot = await getDocs(
    query(
      collection(db, `organizations/${organizationId}/projects`),
      orderBy("createdAt", "desc"),
    ),
  );
  return snapshot.docs.map((projectDoc) =>
    toProjectDocument(projectDoc.id, projectDoc.data()),
  );
}

export async function insertProject(
  organizationId: string,
  projectId: string,
  data: ProjectWriteInput,
): Promise<void> {
  await setDoc(projectDocRef(organizationId, projectId), data);
}

export async function updateProject(
  organizationId: string,
  projectId: string,
  data: ProjectWriteInput,
): Promise<void> {
  await setDoc(projectDocRef(organizationId, projectId), data, { merge: true });
}

export async function deleteProject(
  organizationId: string,
  projectId: string,
): Promise<void> {
  await deleteDoc(projectDocRef(organizationId, projectId));
}
