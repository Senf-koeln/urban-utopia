/** @format */

import React, { type FC } from "react";
import { tv } from "tailwind-variants";
import { cn } from "../../../util/classNameConstructor";
import Button from "../../core/button/Button";
import Icon from "../../core/icon/Icon";
import type { ObjectCardProps } from "./ObjectCard.types";

const ObjectCardStyles = tv({
  slots: {
    Wrapper:
      "group/option relative flex h-full max-w-[150px] w-full shrink-0 grow-0 flex-col items-start justify-start rounded-2xl px-2 ring-1 ring-inset ring-action-primary-default bg-surface-highlight-subdued [&:hover_.checkbox_button]:text-action-primary-pressed focusable",
    ImageWrapper:
      "flex aspect-square w-full items-center justify-center rounded-t-[14px] max-h-[100px] p-0",
    ContentWrapper: "relative flex h-full w-full flex-col ",
    ImageContainer: "relative",
    Title: "flex justify-center gap-2 px-2 pb-0 h-12 items-center break-words",
    EditButton:
      "absolute -right-3 -top-3 z-10 bg-white opacity-0 shadow-md group-hover/option:opacity-100",
  },
  variants: {
    selected: {
      true: {
        Wrapper: "ring-[3px]",
      },
    },
    hoverable: {
      true: {
        Wrapper: "hover:bg-surface-highlight-subdued-hovered cursor-pointer",
      },
    },
  },
});

const ObjectCard: FC<ObjectCardProps> = ({
  data,
  individual,
  onClick,
  onEdit,
  selected,
  className,
  classNames,
}) => {
  const {
    Wrapper,
    ImageWrapper,
    ContentWrapper,
    ImageContainer,
    Title,
    EditButton,
  } = ObjectCardStyles({
    selected:
      selected &&
      (selected.includes(data?.id) || selected.includes(data?.mapId)),
    hoverable: !!onClick,
  });

  return (
    <div
      onClick={() => onClick?.(data)}
      // className={Wrapper()}
      className={cn(
        "opacityTranslateY relative float-left mb-2.5 ml-2.5 w-[calc(33%_-_13px)] rounded-2xl bg-white border-2 [animation:opacityTranslateYFrom50Animation_0.8s] no-touch:hover:bg-surface-highlight-subdued no-touch:hover:border-border-highlight-default",
        selected &&
          (selected.includes(data?.id) || selected.includes(data?.mapId)) &&
          "bg-surface-highlight-subdued border-border-highlight-default border-2",
        individual && "w-[calc(100%_-_20px)]",
        className,
      )}
      role="button"
      tabIndex={0}
    >
      <div className={ContentWrapper()}>
        <div className={ImageContainer()}>
          {onEdit && (
            <div
              className={cn(
                EditButton(),
                "pointer-events-none group-hover/option:pointer-events-auto hidden lg:block",
              )}
            >
              <Button
                variant="white"
                leadingIcon="edit"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(data);
                }}
                className="shadow-lg"
              />
            </div>
          )}

          {individual ? (
            <></>
          ) : data?.imgURL ? (
            <img
              className={ImageWrapper()}
              src={data?.imgURL}
              alt={data?.title || "Object image"}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className={ImageWrapper()}>
              <Icon name="image" className="h-8 w-8" />
            </div>
          )}
        </div>

        <div className={cn(Title(), individual && "h-auto py-2")}>
          <span
            className={cn(
              "text-xs pl-1 text-center text-balace break-normal hyphens-auto",
              classNames?.title,
            )}
          >
            {data?.title}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ObjectCard;
