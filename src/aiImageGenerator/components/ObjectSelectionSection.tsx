import type React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Input,
  List,
  ObjectCard,
  useIsMobile,
} from "@ui";
import { cn } from "@ui/util/classNameConstructor";
import type { FirestoreModel, SelectedObject } from "../types";

interface ObjectSelectionSectionProps {
  search: string;
  setSearch: (search: string) => void;
  models: FirestoreModel[];
  selectedObjects: SelectedObject[];
  setSelectedObjects: React.Dispatch<React.SetStateAction<SelectedObject[]>>;
  loading?: boolean;
}

interface ObjectCardData {
  id: string;
  title: string;
  prompt: string;
  keywords: string[];
  imgURL: string | null;
  category: string;
  handleBack: () => void;
}

const ObjectSelectionSection: React.FC<ObjectSelectionSectionProps> = ({
  search,
  setSearch,
  models,
  selectedObjects,
  setSelectedObjects,
  loading,
  handleBack,
}) => {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const currentLanguage = i18n?.resolvedLanguage || ("de" as "de" | "en");

  const handleObjectClick = (data: ObjectCardData) => {
    const model = models.find((m) => m.id === data.id);
    if (!model) return;

    const isSelected = selectedObjects.some((obj) => obj.id === model.id);
    if (isSelected) {
      setSelectedObjects(selectedObjects.filter((obj) => obj.id !== model.id));
    } else {
      setSelectedObjects([
        ...selectedObjects,
        { ...model, strength: 1, model: model.id },
      ]);
    }
  };

  const filteredModels = models.filter((model) => {
    const searchLower = search.toLowerCase();
    return (
      model.title[currentLanguage].toLowerCase().includes(searchLower) ||
      model.prompt.toLowerCase().includes(searchLower) ||
      model.keywords[currentLanguage].some((keyword) =>
        keyword.toLowerCase().includes(searchLower),
      )
    );
  });

  // Group models by category while preserving order
  const modelsByCategory = filteredModels.reduce(
    (acc, model) => {
      const categoryKey =
        model.categoryTitle?.[currentLanguage] || model.category;
      if (!acc[categoryKey]) {
        acc[categoryKey] = {
          models: [],
          index: model.categoryIndex ?? Number.MAX_SAFE_INTEGER,
        };
      }
      acc[categoryKey].models.push(model);
      return acc;
    },
    {} as Record<string, { models: FirestoreModel[]; index: number }>,
  );

  // Convert to sorted array of entries
  const sortedCategories = Object.entries(modelsByCategory).sort(
    ([, a], [, b]) => a.index - b.index,
  );

  if (loading) {
    return <div>Loading models...</div>;
  }

  return (
    <div className="h-[calc(55vh_-_85px)] overflow-y-scroll px-2 w-full md:h-[calc(100vh_-_75px)] md:px-3 md:w-[420px]">
      <div className="flex flex-col gap-3 pt-2 pl-3 pb-2 md:gap-5 md:pt-5 md:pl-5">
        <Button
          onClick={handleBack}
          variant="outline"
          leadingIcon="arrow-left-md"
          text="Zurück"
          size="sm"
        />
        <h1 className="text-base font-bold text-gray-900 pl-1 md:text-xl">
          {t("aiGenerator.title")}
        </h1>
      </div>

      {!isMobile && (
        <div className="flex w-full flex-col justify-center gap-3 p-3">
          <Input
            type="search"
            placeholder="Suche nach einem Objekt"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
          />
        </div>
      )}

      <div
        className={cn(
          "flex gap-4 md:gap-6 pb-24",
          isMobile ? "flex-col" : "flex-col",
        )}
      >
        {selectedObjects.filter((obj) => obj.individual && obj.title !== search)
          .length > 0 && (
          <div key="individual" className="flex flex-col gap-2">
            <h3 className="body-md-semibold text-text-subdued pl-4">
              Individuelle Objekte
            </h3>

            {selectedObjects
              .filter((obj) => obj.individual && obj.title !== search)
              .map((obj) => (
                <ObjectCard
                  data={{
                    title: obj.title,
                    id: obj.id,
                    prompt: obj.prompt,
                    individual: obj.individual,
                  }}
                  individual={true}
                  selected={selectedObjects.map((obj) => obj.id)}
                  onClick={() => {
                    setSelectedObjects(
                      selectedObjects.filter(
                        (selectedObj) => selectedObj.id !== obj.id,
                      ),
                    );
                  }}
                />
              ))}
          </div>
        )}

        {sortedCategories.map(([category, { models: categoryModels }]) => (
          <div key={category} className="flex flex-col gap-2">
            <h3 className="body-md-semibold text-text-subdued pl-4">
              {category}
            </h3>
            {!isMobile && (
              <List
                CardType={ObjectCard as any}
                data={categoryModels.map((model) => ({
                  id: model.id,
                  title: model.title[currentLanguage],
                  prompt: model.prompt,
                  keywords: model.keywords[currentLanguage],
                  imgURL: model.imgURL,
                  category: model.category,
                }))}
                selected={selectedObjects.map((obj) => obj.id)}
                onClick={handleObjectClick}
                listType="grid"
                multiSelect={true}
              />
            )}

            {isMobile && (
              <div className="flex gap-3 overflow-x-auto pl-3 pr-3 -mx-2 pb-1">
                {categoryModels.map((model) => (
                  <ObjectCard
                    key={model.id}
                    data={{
                      id: model.id,
                      title: model.title[currentLanguage],
                      prompt: model.prompt,
                      keywords: model.keywords[currentLanguage],
                      imgURL: model.imgURL,
                      category: model.category,
                    }}
                    selected={selectedObjects.map((obj) => obj.id)}
                    onClick={handleObjectClick}
                    className="w-[90px] flex-shrink-0"
                    classNames={{
                      title: "text-xs",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {search && (
          <div key="individual" className="flex flex-col gap-2">
            <h3 className="body-md-semibold text-text-subdued pl-4">
              Individuelle Objekte
            </h3>

            <ObjectCard
              data={{
                title: search,
                id: search,
                prompt: search,
                individual: true,
              }}
              selected={selectedObjects.map((obj) => obj.id)}
              individual={true}
              onClick={() => {
                if (selectedObjects.some((obj) => obj.id === search)) {
                  setSelectedObjects(
                    selectedObjects.filter((obj) => obj.id !== search),
                  );
                } else {
                  setSelectedObjects([
                    ...selectedObjects,
                    {
                      id: search,
                      title: search,
                      model: search,
                      prompt: search,
                      individual: true,
                    },
                  ]);
                  setSearch("");
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ObjectSelectionSection;
