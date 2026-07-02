/** @format */

import { useEffect, useRef } from "react";
import {
  generateThemeColor,
  getRelativeLuminance,
  hex2hsl,
  hsl2rgb,
  hsla,
  logColor,
  type RGB,
} from "@ui/styles/helpers";
import { setStoredThemeBaseColor } from "@ui/styles/themeStorage";
export function useThemeColor<T extends { color?: string }>(
  project: T,
  { cssSelector = ":root", store = false } = {},
) {
  const theme = useRef<{
    raw: Record<string, RGB>;
    color: Record<string, string>;
    baseIndex?: number;
    base: [`${number}`, `${number}`, `${number}`, `${number}`];
  }>();

  theme.current = generateThemeColor(hex2hsl(project?.color || "#ffd061"));

  const [defaultVal, hovered, pressed, depressed] = theme.current.base || [
    "400",
    "500",
    "600",
    "800",
  ];

  useEffect(() => {
    if (store) {
      setStoredThemeBaseColor(theme.current.color[defaultVal]);
    }
  }, [theme.current.color[defaultVal], store]);

  const invertText =
    getRelativeLuminance(
      hsl2rgb(
        ...theme.current.raw[
          (theme.current.baseIndex || 0) > 1 ? hovered : defaultVal
        ],
      ),
    ) < 135;

  const { color } = theme.current;
  const css = `${cssSelector} {
      --primary-100: ${color["100"]};
      --primary-200: ${color["200"]};
      --primary-300: ${color["300"]};
      --primary-400: ${color["400"]};
      --primary-500: ${color["500"]};
      --primary-600: ${color["600"]};
      --primary-700: ${color["700"]};
      --primary-800: ${color["800"]};
      --primary-900: ${color["900"]};
      --primary-1000: ${color["1000"]};
      --surface-hovered: ${color["200"]};
      --surface-pressed: ${color["300"]};
      --surface-highlight-default: ${color["400"]};
      --surface-highlight-subdued: ${color["100"]};
      --surface-highlight-subdued-hovered: ${color["200"]};
      --surface-highlight-subdued-pressed: ${color["300"]};
      --text-highlight: ${color["900"]};
      --icon-highlight: ${color["800"]};
      --border-hovered: ${color["500"]};
      --border-pressed: ${color["600"]};
      --border-highlight-default: ${color["500"]};
      --border-highlight-subdued: ${color["300"]};
      --focused-default: ${color["500"]};
      --action-primary-default: ${color[defaultVal]};
      --action-primary-hovered: ${color[hovered]};
      --action-primary-pressed: ${color[pressed]};
      --action-primary-depressed: ${color[depressed]};
      --action-secondary-hovered: ${color["200"]};
      --action-secondary-pressed: ${color["300"]};
      --action-tertiary-hovered: ${color["200"]};
      --action-tertiary-pressed: ${color["300"]};
			--text-on-primary: ${invertText ? "white" : "var(--text-default)"};
	}
  `;
  return css;
}
