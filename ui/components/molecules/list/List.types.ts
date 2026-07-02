/** @format */

import type { ComponentType, MouseEventHandler } from "react";

import type { IdeaCardProps } from "../cards/IdeaCard.types";

export interface ListProps extends IdeaCardProps {
  CardType?: ComponentType<IdeaCardProps & Record<string, unknown>>;
  data?: Array<Record<string, unknown> | string>;
  onClick: MouseEventHandler<HTMLButtonElement>;
  handleButtonClick: MouseEventHandler<HTMLButtonElement>;
  listType?: "grid" | "list";
  className?: string;
  loading?: boolean;
  dropdown?: unknown;
  organization?: unknown;
  ideasData?: unknown;
  firebaseUser?: unknown;
  listEndText?: string;
  variant?: string;
}
