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

export const useModels = () => {
  const [models, setModels] = useState<FirestoreModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categories = (await listUtopiaCategories())
          .filter(
            (category) =>
              category.categoryId != null &&
              String(category.categoryId).length > 0,
          )
          .map((category) => ({
            ...category,
            id: String(category.categoryId),
          })) as FirestoreCategory[];
        
        // Sort categories by index
        categories.sort((a, b) => a.index - b.index);

        const modelsSnapshot = await listModels();
        const modelsList = modelsSnapshot
          .filter(
            (model) => model.modelId != null && String(model.modelId).length > 0,
          )
          .map((model) => {
          const modelData = model as FirestoreModel;
          const category = categories.find(
            (cat) => cat.id === modelData.category,
          );

          return {
            ...modelData,
            id: String(model.modelId),
            categoryTitle: category?.title,
            categoryIndex:
              category?.index ?? Number.MAX_SAFE_INTEGER,
          };
        });

        // Sort models by category index
        modelsList.sort((a, b) => (a.categoryIndex ?? 0) - (b.categoryIndex ?? 0));

        setModels(modelsList);
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { models, loading, error };
}; 