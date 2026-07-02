export type WorkshopAccessId = {
  id: string;
  index: string | number;
  credits: number;
};

/**
 * Workshop access codes and per-user credit limits.
 *
 * For local development, enter `demo-workshop` in the access modal.
 * For production workshops, replace or extend this list, or load codes from
 * Firestore (see `userContext` credit accounting).
 */
export const ids: WorkshopAccessId[] = [
  { id: "demo-workshop", index: "demo", credits: 100 },
];
