/** @format */

import { type FC, useCallback, useEffect, useMemo, useState } from "react";

import InfiniteScroll from "react-infinite-scroller";
import { usePrevious } from "../../../hooks/usePrevious";
import { cn } from "../../../util/classNameConstructor";
import type { IdeaCardProps } from "../cards/IdeaCard.types";
import type { ListProps } from "./List.types";

/** Stable key for list items so removal only unmounts the removed item */
function getItemKey(item: unknown, index: number): string {
  if (item == null || typeof item !== "object") return `list-${index}`;
  const o = item as Record<string, unknown>;
  const id =
    o.mapId ??
    o.documentId ??
    o.commentId ??
    o.ideaId ??
    o.surveyId ??
    o.ideaMapId ??
    o.projectId ??
    o.organizationId ??
    o.id;
  return id != null ? String(id) : `list-${index}`;
}

const List: FC<ListProps> = ({
  listType,
  loading,
  CardType,
  dropdown,
  data,
  organization,
  ideasData,
  project,
  handle,
  user,
  firebaseUser,
  listEndText,
  className,
  variant,
  ...props
}) => {
  const dataLength = data?.length ?? 0;
  const prevdataLength = usePrevious({ dataLength });
  const prevDropdown = usePrevious({ dropdown });

  const itemsPerPage = 1;
  const [hasMoreItems, sethasMoreItems] = useState(true);
  const [listItems, setListItems] = useState(0);

  const itemRemoved =
    prevdataLength != null && dataLength < (prevdataLength.dataLength ?? 0);
  const filterOrDataRefreshed =
    (dropdown != null &&
      prevDropdown != null &&
      prevDropdown.dropdown !== dropdown) ||
    (prevdataLength != null && dataLength > (prevdataLength.dataLength ?? 0));

  useEffect(() => {
    if (itemRemoved) {
      setListItems((prev) => Math.min(prev, dataLength));
      sethasMoreItems(dataLength > 0);
    } else if (
      filterOrDataRefreshed &&
      (dataLength > 0 || dropdown !== prevDropdown?.dropdown)
    ) {
      setListItems(1);
      sethasMoreItems(true);
    }
  }, [
    dataLength,
    dropdown,
    itemRemoved,
    filterOrDataRefreshed,
    prevDropdown?.dropdown,
  ]);

  const visibleData = useMemo(() => {
    if (!data?.length) return [];
    const slice: Array<{ item: (typeof data)[number]; index: number }> = [];
    for (let i = 0; i < listItems && i < data.length; i++) {
      const item = data[i];
      if (item != null && typeof item === "object") {
        slice.push({ item, index: i });
      }
    }
    return slice;
  }, [data, listItems]);

  const showItems = (CardComponent: ListProps["CardType"]) => {
    if (!CardComponent) return null;
    return visibleData.map(({ item, index }) => (
      <div
        key={getItemKey(item, index)}
        className={cn(
          "mt-4",
          listType === "grid" ? "contents" : "flex flex-col",
        )}
      >
        <CardComponent
          {...({
            data: item as IdeaCardProps["data"],
            organization,
            project,
            ideasData,
            handle,
            user,
            variant,
            ...props,
          } as IdeaCardProps & Record<string, unknown>)}
        />
      </div>
    ));
  };

  const loadMore = useCallback(() => {
    if (listItems >= (data?.length ?? 0)) {
      sethasMoreItems(false);
    } else {
      setTimeout(() => {
        setListItems((prev) => prev + itemsPerPage);
      }, 50);
    }
  }, [listItems, data?.length]);

  return (
    <>
      {data && data.length > 0 && (
        <InfiniteScroll
          id="List"
          loadMore={() => loadMore()}
          hasMore={hasMoreItems}
          useWindow={false}
          className={className}
        >
          {showItems(CardType)}
          {listEndText && ((data?.length ?? 0) < 1 || !hasMoreItems) && (
            <div className="text-center text-text-subdued h-32 flex items-center justify-center">
              <span>{listEndText}</span>
            </div>
          )}
        </InfiniteScroll>
      )}
    </>
  );
};

export default List;
