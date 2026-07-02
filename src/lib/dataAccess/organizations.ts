import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore/lite";
import { db } from "../firebase";

export type OrganizationDocument = Record<string, unknown> & {
  organizationId: string;
};

export type OrganizationWriteInput = Record<string, unknown>;

export async function insertOrganization(
  organizationId: string,
  data: OrganizationWriteInput,
): Promise<void> {
  await setDoc(doc(db, `organizations/${organizationId}`), data);
}

export async function listOrganizationsOrderedByCreatedAt(): Promise<
  OrganizationDocument[]
> {
  const snapshot = await getDocs(
    query(collection(db, "organizations"), orderBy("createdAt", "desc")),
  );
  return snapshot.docs.map((organizationDoc) => ({
    organizationId: organizationDoc.id,
    ...organizationDoc.data(),
  }));
}
