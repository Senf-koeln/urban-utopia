/** @format */

import type { MouseEventHandler } from "react";

export interface IdeaCardData {
  title?: string;
  body?: string;
  likeCount?: number;
  commentCount?: number;
  ideaId?: string;
  isHidden?: boolean;
  alarmingReason?: string;
  translations?: any;
  lang?: string;
  topic?: string;
}

export interface IdeaCardHandle {
  openCard?: (event: any, type: string, id: string) => void;
  buttonLike?: (event: any, id: string) => Promise<boolean>;
  buttonComment?: (event: any, id: string) => void;
  refetchData?: (id: string) => void;
}

export interface IdeaCardProps {
  data?: IdeaCardData;
  handle?: IdeaCardHandle;
  user?: any;
  project?: any;
  ideaMap?: any;
  title?: string;
  body?: string;
  projectsSize?: number;
  organizationType?:
    | "Vereine"
    | "Initiativen"
    | "Politik"
    | "Planungsbüros"
    | "Stadtverwaltung"
    | "Presse"
    | "Sonstige";
  img?: string;
  handleButtonOpenCard?: MouseEventHandler<HTMLButtonElement>;
  lightCard?: boolean;
}
