/** @format */
import { css } from "styled-components";
import theme from "./theme";

const lightnessValues = ["light", "medium", "dark"] as const;
export type Palette = typeof theme.colors.palette;
export type BaseType =
  | "senf"
  | "primary"
  | "white"
  | "opaque"
  | "transparent"
  | "invisible";
export type SignalColor = "alert" | "warning" | "success" | "info";
export type BaseColor = "white" | "grey" | "shade";
export type Lightness = typeof lightnessValues[number];
export type Border = Lightness | boolean;
export type Shadow = Lightness | boolean;
export type Size = "small" | "medium" | "large" | "sm" | "md" | "lg";
export type InteractionState = "hover" | "active";
export interface BaseLayerProps {
  type: BaseType;
  color?: BaseColor | SignalColor;
  lightness?: Lightness;
  border?: Border;
  shadow?: Shadow;
  shadowSize?: Size;
  interactive?: boolean;
  activatable?: boolean | SignalColor | BaseColor | "primary";
  textColor?: boolean;
  focused?: boolean;
}

const lightnessMap = (
  state?: InteractionState,
  lightness: Lightness = "light"
) => {
  let i = lightnessValues.indexOf(lightness);
  if (state === "hover") i += 2;
  if (state === "active") i += 4;
  return [
    "white",
    "grey-100",
    "grey-200",
    "grey-300",
    "grey-400",
    "grey-500",
    "grey-600",
  ][i];
};

const getColor = (
  { type, color, lightness, border }: BaseLayerProps,
  colors: Palette,
  state?: InteractionState
) => {
  switch (type) {
    case "senf":
    case "primary":
      return colors[
        state === "active"
          ? "blend-shade-primary-800"
          : state === "hover"
            ? "blend-shade-primary-700"
            : "primary"
      ];
    case "opaque": {
      return colors[
        `${color}${state === "active" ? "-800" : state === "hover" ? "-900" : ""
        }`
      ];
    }
    case "transparent": {
      if (color === "white")
        return colors[
          `white/${state === "active" ? "800" : state === "hover" ? "700" : "500"
          }`
        ];
      return colors[
        `${color}/${state === "active" ? "500" : state === "hover" ? "400" : "300"
        }`
      ];
    }
    case "white":
      return colors[
        lightnessMap(state, border !== "dark" ? lightness : undefined)
      ];
    case "invisible":
    default:
      return state === "active"
        ? colors["grey/300"]
        : state === "hover"
          ? colors["grey/200"]
          : "transparent";
  }
};
const getBorder = (
  { type, color, border, lightness }: BaseLayerProps,
  colors: Palette,
  state?: InteractionState
) => {
  const lightBorder = border === "light";
  if (!border) return "transparent";
  switch (type) {
    case "senf":
    case "primary":
      return colors[lightBorder ? "white/500" : "shade/300"] || "transparent";
    case "opaque":
      return colors[lightBorder ? "white/600" : "text/500"] || "transparent";
    case "transparent":
      return (
        colors[color === "white" ? "white/500" : `${color}/300`] ||
        "transparent"
      );
    case "white":
      return (
        colors[lightBorder ? "white/800" : lightnessMap("active", lightness)] ||
        "transparent"
      );
    case "invisible":
      return (border && colors["grey/300"]) || "transparent";
    default:
      return (state && colors["grey/300"]) || "transparent";
  }
};
const getText = (
  { type, color, textColor }: BaseLayerProps,
  colors: Palette
) => {
  if (type === "opaque" && color !== "white") return colors.white;
  if (!textColor) return "inherit";
  switch (type) {
    case "senf":
    case "primary":
      return colors.shade;
    case "transparent":
    case "invisible":
      return colors[color === "white" ? "text" : `${color}`];
    case "white":
    default:
      return colors.text;
  }
};
const getShadow = (
  { type, shadow, color, shadowSize = "medium" }: BaseLayerProps,
  colors: Palette
) => {
  const shadowColor = () => {
    if (shadow === false) return false;
    if (shadow === "light") return colors["white/500"];
    if (shadow === "medium") return colors["grey/300"];
    if (shadow === "dark") return colors["shade/500"];
    if (shadow) return shadow;
    switch (type) {
      case "senf":
      case "primary":
        return colors["blend-shade-primary-700"];
      case "white":
        return colors["grey/300"];
      case "opaque":
        return colors[`${color}/800`];
      default:
        return false;
    }
  };
  if (!shadowColor()) return "0 0 transparent";
  const sizeMap = { small: 1, medium: 2, large: 3, sm: 1, md: 2, lg: 3 };
  const shadowMap = [7, 15, 3];
  const [y, s, o] = shadowMap.map((e) => sizeMap[shadowSize] * e);
  return `0px -${y}px ${s}px -${o}px ${colors["white/500"]},
  0px ${y}px ${s}px -${o}px ${shadowColor()}`;
};

export default (
  { interactive = true, activatable = true, ...props }: BaseLayerProps,
  colors: Palette
) => {
  return css`
    --bgColor: ${getColor(props, colors)};
    --color: ${getText(props, colors)};
    --border-color: ${getBorder(props, colors)};
    --border-width: 1px;
    --border: inset 0 0 0 var(--border-width) var(--border-color);

    // box-sizing should be in the global styles and applied to all elements with a * selector
    box-sizing: border-box;
    color: var(--color);
    background-color: var(--bgColor);
    box-shadow: ${getShadow(props, colors)}, var(--border);

    transition: border 200ms;

    &:hover:not(:disabled) {
      --bgColor: ${getColor(props, colors, interactive ? "hover" : undefined)};
      --border-color: ${getBorder(props, colors, interactive ? "hover" : undefined)};
    }
    &:active:not(:disabled) {
      --bgColor: ${getColor(props, colors, interactive ? "active" : undefined)};
      --border-color: ${getBorder(props, colors, interactive ? "active" : undefined)};
    }

    ${interactive &&
    css`
      cursor: pointer;
    `}

    ${interactive &&
    activatable &&
    css`
      &:focus-visible:not(:disabled) {
        --border-color: ${colors.primary};
        --border-width: 3px;
        ${typeof activatable === "string" &&
      css`
          --bgColor: ${colors[`${activatable}-700`]} !important;
        `}
      }
    `}
		${interactive &&
    activatable &&
    props.focused &&
    css`
      &,
      &:hover,
      &:active {
        --border-color: ${colors.primary} !important;
        --border-width: 3px;
        ${typeof activatable === "string" &&
      css`
          --bgColor: ${colors[`${activatable}-700`]} !important;
        `}
      }
    `}
  `;
};
