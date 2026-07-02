/** @format */
import type { Theme } from "styled-system";
import palette from "./palette";
import {
  generateThemeColors,
  composite,
  generateRaw,
  generateStaticColors,
  logColors,
  ColorPallet,
  HSL,
} from "./helpers";
import layers, { BaseLayerProps } from "./layers";

// create sizes type
export interface Sizes {
  sm: "sm" | "small";
  md: "md" | "medium";
  lg: "lg" | "large";
  xl: "xl" | "xlarge";
  full: "full";
  fullscreen: "fullscreen";
}

const colors: ColorPallet = {
  primary: [46, 100, 71],
  shade: [37, 100, 30],
  grey: [44, 15, 46],
  text: [36, 27, 11],
};
const compositeColors: ColorPallet = {
  primary: colors.primary,
  shade: colors.shade,
};
const transparent: ColorPallet = {
  white: [0, 0, 100],
};
const categories: ColorPallet = {
  bike: [227, 70, 68],
  traffic: [194, 75, 70],
  social: [10, 68, 70],
  sports: [27, 83, 77],
  utilities: [262, 85, 78],
  environment: [154, 50, 70],
  other: [42, 91, 78],
};
const signal: ColorPallet = {
  alert: [2, 90, 60],
  warning: [38, 100, 57],
  success: [145, 100, 30],
  info: [242, 81, 60],
};
const luminance = [100, 75, 50, 35, 25, 15, 10, 7, 5, 2];
const blendLuminance = [50, 35, 25, 10];

const themeColors = {
  ...generateThemeColors(colors, luminance),
  ...generateThemeColors(
    { "blend-shade-primary": compositeColors.shade },
    blendLuminance,
    colors.primary as HSL
  ),
  ...generateThemeColors(
    {
      "blend-shade-primary-bg": composite(
        ...(colors.primary as HSL),
        3 / 4,
        compositeColors.shade as HSL
      ),
    },
    [15]
  ),
  ...generateThemeColors(transparent, luminance, false),
  ...generateThemeColors(categories),
  ...generateThemeColors(signal, luminance),
  ...generateThemeColors(signal, luminance),
};

// after modifying the theme colors, make them static to make use of TS
/**
 * After modifying the theme colors, make them static to make use of TS
 * Export the output in ./palette.ts and import it here.
 */
// generateStaticColors(themeColors)

// for testing
// logColors(themeColors)

/**
 * @todo I think we should decide whether we return variables with a unit or without. My proposal is that we return units as numbers and assume pixel values. We can then provide a px-to-rem function and devs can transform the values to rem as well
 * @todo I also think the keys should be singular because I think it is more intuitive to use `theme.color.primary-100` or `theme.radius[0]
 *
 * Check out the IBM Carbon Design System for inspiration
 * https://carbondesignsystem.com/guidelines
 */

const theme = {
  fontFamily: "Nunito, -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",

  // SPACE are not complete/verified
  space: [0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44].map(
    (numInPX) => `${numInPX / 16}rem`
  ),
  // spacing: {
  //   "01": 0.125,
  //   "02": 0.25,
  //   "03": 0.5,
  //   "04": 0.75,
  //   "05": 1,
  //   "06": 1.5,
  //   "07": 2,
  //   "08": 2.5,
  //   "09": 3,
  //   "10": 4,
  //   "11": 5,
  //   "12": 6,
  //   "13": 10,
  // },

  // font sizes converted from px to default browsers rem (16 px base)
  fontSizes: [12, 14, 16, 20, 24, 32].map((numInPX) => numInPX / 16),
  fontWeights: [500, 600, 700, 900],

  lineHeight: [1, 1.2, 1.4, 1.5],
  letterSpacings: [-0.01, 0, 0.01],

  easing: {
    productive: "cubic-bezier(0.4, 0.14, 0.3, 1)",
    expressive: "cubic-bezier(0.2, 0, 0.2, 1)",
  },

  // input and button height
  inputHeight: (size: Sizes["sm" | "md" | "lg"]) => {
    switch (size) {
      case "sm":
      case "small":
        return "36px";
      case "md":
      case "medium":
        return "44px";
      case "lg":
      case "large":
      default:
        return "50px";
    }
  },
  buttonWidth: (size: Sizes["sm" | "md" | "lg"], width: string) => {
    switch (width) {
      case "max":
        return "100%";
      case "height":
        return theme.inputHeight(size);
      default:
        return width ? `${width}px` : "auto";
    }
  },
  inputPadding: (size: Sizes["sm" | "md" | "lg"]) => {
    switch (size) {
      case "sm":
      case "small":
        return "0.5rem";
      case "md":
      case "medium":
        return "0.75rem";
      case "lg":
      case "large":
      default:
        return "0.875rem";
    }
  },
  borderRadius: (size: Sizes[keyof Sizes]) => {
    switch (size) {
      case "sm":
      case "small":
        return "12px";
      case "md":
      case "medium":
        return "14px";
      case "lg":
      case "large":
        return "16px";
      case "xl":
      case "xlarge":
        return "18px";
    }
  },
  width: (size: Sizes[keyof Sizes], padding?: boolean) => {
    const widths = {
      sm: "240px",
      md: "384px",
      lg: "614px",
      xl: "983px",
    };
    const composite = (w, max = "100vw", p = theme.space[7]) =>
      `max(calc(${max} - ${p}), min(${w}, ${max}))`;
    if (padding) return composite(widths[size]);
    switch (size) {
      case "sm":
      case "small":
        return widths.sm;
      case "md":
      case "medium":
      default:
        return widths.md;
      case "lg":
      case "large":
        return widths.lg;
      case "xl":
      case "xlarge":
        return widths.xl;
      case "full":
        return composite(widths.xl);
      case "fullscreen":
        return "100vw";
    }
  },

  // what exactly is SIZES? Do we need that?
  sizes: [],

  // should we split up BORDERS?? Is borderstyles really necessary? Bestpractices?
  borders: [],
  borderWidths: [0, 1, 2, 3],
  borderStyles: ["dashed", "solid"],

  // RADII are not complete/verified
  radii: [8, 10, 14, 18, 20, 24, 28, 30],

  // OPACITIES are not complete/verified
  opacities: [0.4, 0.6, 0.75],

  shadows: [
    "0px 12px 18px -8px",
    "0px 4px 6px -2px",
    "0px -4px 10px 4px",
    "0px -2px 5px 2px",
    "0px 12px 18px -10px",
    "0px 6px 8px -1px",
  ],

  // Does Louis define the TRANSITIONS??
  transitions: [],

  // bestpractice for ZINDICES??
  zIndices: [0, 1],

  colors: {
    primary: {
      primary160: "#d6ab00",
      primary140: "#e8ba02",
      primary120: "#f2c71c",
      primary100: "#fed957",
      primary75: "#fee381",
      primary50: "#feecab",
      primary35: "#fff2c4",
      primary20: "#fff7dd",
    },
    beige: {
      beige100: "#e2b736",
      beige75: "#e9c968",
      beige50: "#f0db9a",
      beige35: "#f5e6b9",
      beige20: "#f9f1d7",
      beige10: "#fcf8eb",
      beige75tra: "rgba(226, 183, 54, 0.75)",
      beige50tra: "rgba(226, 183, 54, 0.5)",
      beige35tra: "rgba(226, 183, 54, 0.35)",
      beige20tra: "rgba(226, 183, 54, 0.2)",
      beige10tra: "rgba(226, 183, 54, 0.1)",
    },
    shade: {
      shade100: "#",
      shade75: "#",
      shade50: "#",
      shade35: "#",
      shade20: "#",
      shade10: "#",
      shade75tra: "",
      shade50tra: "",
      shade35tra: "",
      shade20tra: "",
      shade10tra: "rgba(155, 95, 0, 0.1)",
    },
    brown: {
      brown100: "#baa04f",
      brown75: "#cbb87b",
      brown50: "#dccfa7",
      brown35: "#e7dec2",
      brown20: "#f1ecdc",
      brown10: "#F8F5ED",
      brown7: "#faf8f3",
      brown4: "#fcfbf8",
      brown75tra: "rgba(186, 160, 79, 0.75)",
      brown50tra: "rgba(186, 160, 79, 0.5)",
      brown35tra: "rgba(186, 160, 79, 0.35)",
      brown20tra: "rgba(186, 160, 79, 0.2)",
      brown10tra: "rgba(186, 160, 79, 0.1)",
      brown7tra: "rgba(186, 160, 79, 0.07)",
      brown4tra: "rgba(186, 160, 79, 0.04)",
    },
    greyscale: {
      greyscale100: "#c3baa2",
      greyscale75: "#d2cbb9",
      greyscale50: "#e1dcd0",
      greyscale35: "#eae7df",
      greyscale20: "#f3f1ec",
      greyscale10: "#f8f7f5",
      greyscale8: "#fafaf9",
      greyscale5: "#fcfcfb",
      greyscale75tra: "rgba(195, 186, 162, 0.75)",
      greyscale50tra: "rgba(195, 186, 162, 0.5)",
      greyscale35tra: "rgba(195, 186, 162, 0.35)",
      greyscale20tra: "rgba(195, 186, 162, 0.2)",
      greyscale10tra: "rgba(195, 186, 162, 0.11)",
      greyscale8tra: "rgba(192, 188, 175, 0.08)",
      greyscale5tra: "rgba(192, 188, 175, 0.05)",
    },
    black: {
      black100: "rgba(0, 0, 0, 1)",
      black80tra: "rgba(0, 0, 0, 0.8)",
      black60tra: "rgba(0, 0, 0, 0.6)",
      black40tra: "rgba(0, 0, 0, 0.4)",
      black30tra: "rgba(0, 0, 0, 0.3)",
    },
    white: {
      white100: "rgba(255, 255, 255, 1)",
      white80tra: "rgba(255, 255, 255, 0.8)",
      white60tra: "rgba(255, 255, 255, 0.6)",
      white50tra: "rgba(255, 255, 255, 0.5)",
      white40tra: "rgba(255, 255, 255, 0.4)",
      white30tra: "rgba(255, 255, 255, 0.3)",
      white20tra: "rgba(255, 255, 255, 0.2)",
    },
    signal: {
      redDark: "#ca3336",
      red: "#ff3c3e",
      greenDark: "#00857b",
      green: "#009a8e",
      blueDark: "#241ebe",
      blue: "#322bf3",
    },
    primaryHoverLayerShadowColor: "rgba(235, 184, 0, 0.5)",
    palette,
  },
  layer: (props: BaseLayerProps) => layers(props, theme.colors.palette),
};
export default theme;
