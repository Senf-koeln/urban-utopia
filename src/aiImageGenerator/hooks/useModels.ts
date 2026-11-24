import { useEffect, useState } from 'react';
import { listModels, listUtopiaCategories } from "@/lib/dataAccess";

interface FirestoreCategory {
  id: string;
  name: string;
  title: {
    de: string;
    en: string;
  };
  index: number;
}

export interface FirestoreModel {
  id: string;
  title: {
    de: string;
    en: string;
  };
  prompt: string;
  keywords: {
    de: string[];
    en: string[];
  };
  imgURL: string | null;
  category: string;
  categoryTitle?: {
    de: string;
    en: string;
  };
  categoryIndex?: number;
}

let cachedModels: FirestoreModel[] | null = null;
let inFlightModelsPromise: Promise<FirestoreModel[]> | null = null;

async function fetchModelsOnce(): Promise<FirestoreModel[]> {
  if (cachedModels) return cachedModels;
  if (!inFlightModelsPromise) {
    inFlightModelsPromise = (async () => {
      const [rawCategories, modelsSnapshot] = await Promise.all([
        listUtopiaCategories(),
        listModels(),
      ]);

      const categories = rawCategories
        .filter(
          (category) =>
            category.categoryId != null &&
            String(category.categoryId).length > 0,
        )
        .map((category) => ({
          ...category,
          id: String(category.categoryId),
        })) as FirestoreCategory[];

      categories.sort((a, b) => a.index - b.index);
      const categoryById = new Map(categories.map((cat) => [cat.id, cat]));

      const modelsList = modelsSnapshot
        .filter(
          (model) => model.modelId != null && String(model.modelId).length > 0,
        )
        .map((model) => {
          const modelData = model as FirestoreModel;
          const category = categoryById.get(modelData.category);

          return {
            ...modelData,
            id: String(model.modelId),
            categoryTitle: category?.title,
            categoryIndex: category?.index ?? Number.MAX_SAFE_INTEGER,
          };
        });

      modelsList.sort((a, b) => (a.categoryIndex ?? 0) - (b.categoryIndex ?? 0));
      cachedModels = modelsList;
      return modelsList;
    })().finally(() => {
      inFlightModelsPromise = null;
    });
  }
  return inFlightModelsPromise;
}

export const useModels = () => {
  const [models, setModels] = useState<FirestoreModel[]>(cachedModels ?? []);
  const [loading, setLoading] = useState(cachedModels === null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cachedModels) return;
    let cancelled = false;

    fetchModelsOnce()
      .then((modelsList) => {
        if (cancelled) return;
        setModels(modelsList);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err as Error);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { models, loading, error };
};