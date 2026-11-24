const { filterTokensByType } = require("./fns");
const themeTokens = require("./output/light.json");
const globalTokens = require("./output/global.json");
const plugin = require("tailwindcss/plugin");


const extractTokenIndex = (tokens) =>
  Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => {
      const keyArr = key.split("-");
      const removedKey = keyArr.shift();
      return [keyArr.join(), value];
    }),
  );

const colors = {
  ...filterTokensByType("color", themeTokens),
  ...filterTokensByType("color", globalTokens),
};
// const typography = filterTokensByType("typography", tokens);
const fontFamily = extractTokenIndex(
  filterTokensByType("fontFamilies", globalTokens),
);
const fontWeight = extractTokenIndex(
  filterTokensByType("fontWeights", globalTokens),
);
const lineHeight = extractTokenIndex(
  filterTokensByType("lineHeights", globalTokens),
);
const fontSize = extractTokenIndex(
  filterTokensByType("fontSizes", globalTokens),
);
const letterSpacing = extractTokenIndex(
  filterTokensByType("letterSpacing", globalTokens),
);
const borderWidth = extractTokenIndex(
  filterTokensByType("borderWidth", globalTokens),
);
const opacity = extractTokenIndex(filterTokensByType("opacity", globalTokens));

const boxShadow = {
  ...filterTokensByType("boxShadow", themeTokens).shadows,
  ...filterTokensByType("boxShadow", themeTokens).borders,
  "t-sm": "0 -1px 2px 0 rgb(0 0 0 / 0.05)",
  "r-sm": "1px 0 2px 0 rgb(0 0 0 / 0.05)",
  "l-sm": "-1px 0 2px 0 rgb(0 0 0 / 0.05)",
  "t": "0 -1px 2px 0 rgb(0 0 0 / 0.05)",
  "l": "1px 0 3px 0 rgb(0 0 0 / 0.1), 1px 0 2px -1px rgb(0 0 0 / 0.1);",
  "r": "-1px 0 3px 0 rgb(0 0 0 / 0.1), -1px 0 2px -1px rgb(0 0 0 / 0.1);",
  "t-md": "0 -2px 4px -1px rgb(0 0 0 / 0.1), 0 -1px 2px -2px rgb(0 0 0 / 0.1)",
  "r-md": "4px 0 6px -1px rgb(0 0 0 / 0.1), 2px 0 4px -2px rgb(0 0 0 / 0.1)",
  "l-md": "-4px 0 6px -1px rgb(0 0 0 / 0.1), -2px 0 4px -2px rgb(0 0 0 / 0.1)",
  "t-lg": "0 -4px 6px -1px rgb(0 0 0 / 0.1), 0 -2px 4px -2px rgb(0 0 0 / 0.1)",
  "r-lg": "10px 0 15px -3px rgb(0 0 0 / 0.1), 4px 0 6px -4px rgb(0 0 0 / 0.1)",
  "l-lg": "-10px 0 15px -3px rgb(0 0 0 / 0.1), -4px 0 6px -4px rgb(0 0 0 / 0.1)",
  "t-xl": "0 -8px 10px -6px rgb(0 0 0 / 0.1), 0 -4px 6px -5px rgb(0 0 0 / 0.1)",
  "r-xl": "20px 0 25px -5px rgb(0 0 0 / 0.1), 8px 0 10px -6px rgb(0 0 0 / 0.1)",
  "l-xl": "-20px 0 25px -5px rgb(0 0 0 / 0.1), -8px 0 10px -6px rgb(0 0 0 / 0.1)",
  "t-2xl": "0 -16px 20px -12px rgb(0 0 0 / 0.25)",
  "r-2xl": "25px 0 50px -12px rgb(0 0 0 / 0.25)",
  "l-2xl": "-25px 0 50px -12px rgb(0 0 0 / 0.25)",
};
const borderRadius = extractTokenIndex(
  filterTokensByType("borderRadius", globalTokens),
);
const textIndent = filterTokensByType("dimension", themeTokens); // how would we use this?

const keyframes = {
  // revolve: {
  //   '0%': { transform: 'rotate(-20deg)' },
  //   '100%': { transform: 'rotate(340deg)' },
  // },
  slideDown: {
    from: { height: "0px", opacity: 0 },
    to: { height: "var(--radix-accordion-content-height)", opacity: 1 },
  },
  slideUp: {
    from: { height: "var(--radix-accordion-content-height)", opacity: 1 },
    to: { height: "0px", opacity: 0 },
  },
  revolve: {
    "0%": { transform: "rotate(140deg)" },
    "100%": { transform: "rotate(500deg)" },
  },
  opacityTranslateY: {
    "0%": {
      opacity: 0,
      transform: "translateY(50%)",
    },
    "100%": {
      opacity: 1,
      transform: "translateY(0%)",
    },
  },
  fadeInUp: {
    "0%": { opacity: "0", transform: "translateY(20px)" },
    "100%": { opacity: "1", transform: "translateY(0)" },
  },
  fadeIn: {
    "0%": { opacity: "0" },
    "100%": { opacity: "1" },
  },
  scaleIn: {
    "0%": { opacity: "0", transform: "scale(0.96) translateY(12px)" },
    "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
  },
  navMenuIn: {
    "0%": { opacity: "0", transform: "translateY(-4px) scale(0.98)" },
    "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
  },
};
const animation = {
  // revolve: 'revolve 0.75s infinite cubic-bezier(0.2, 0.3, 0.3, 0.7)',
  revolve: "revolve 0.75s infinite cubic-bezier(0.3, 0.5, 0.7, 0.5)",
  opacityTranslateY: "opacityTranslateY 0.8s",
  slideDown: "slideDown 300ms cubic-bezier(0.87, 0, 0.13, 1)",
  slideUp: "slideUp 300ms cubic-bezier(0.87, 0, 0.13, 1)",
  fadeInUp: "fadeInUp 0.6s cubic-bezier(.2,.6,.3,1) both",
  fadeIn: "fadeIn 0.5s cubic-bezier(.2,.6,.3,1) both",
  scaleIn: "scaleIn 0.5s cubic-bezier(.2,.6,.3,1) both",
  navMenuIn: "navMenuIn 160ms cubic-bezier(.2,.6,.3,1) both",
};

const transitionTimingFunction = {
  expressive: "cubic-bezier(.8, 0, .2, 1)",
  "expressive-out": "cubic-bezier(.1, 1, .1, 1)",
  "expressive-in": "cubic-bezier(1, .1, 1, .1)",
  "expressive-in-out": "cubic-bezier(1, .1, .1, 1)",
};

// Add this new fontSize modifier that uses CSS variable
const fontSizeWithModifier = Object.fromEntries(
  Object.entries(fontSize).map(([key, value]) => [
    key,
    // Only apply the modifier to specific body classes
    key === "base" || key === "lg" || key === "sm" || key === "xs"
      ? `calc(${value} * var(--body-font-size-modifier, 1))`
      : value,
  ]),
);

const lineHeightWithModifier = Object.fromEntries(
  Object.entries(lineHeight).map(([key, value]) => [
    key,
    // Apply the modifier to all line heights to maintain proportions
    `calc(${value} * var(--body-font-size-modifier, 1))`,
  ]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "../ui/**/*.{html,js,jsx,ts,tsx}",
    "../src/**/*.{html,js,jsx,ts,tsx}",
  ],
  darkMode: "media", // or 'media' or 'class'
  theme: {
    extend: {
      colors,
      fontFamily,
      fontWeight,
      lineHeight: lineHeightWithModifier,
      fontSize: fontSizeWithModifier,
      letterSpacing,
      borderWidth,
      opacity,
      boxShadow,
      borderRadius,
      textIndent,
      keyframes,
      animation,
      transitionTimingFunction
    },
  },
  variants: {},
  plugins: [
    require("@tailwindcss/container-queries"),
    ({ addVariant, addBase }) => {
      addVariant(
        "no-touch",
        "@media (hover: hover) and (pointer: fine) { & }",
      );
      // Register CSS custom properties for animation
      addBase({
        '@property --pulse-color': {
          syntax: '"<color>"',
          inherits: 'false',
          'initial-value': '#4964c9',
        },
        '@property --pulse-bg-color': {
          syntax: '"<color>"',
          inherits: 'false',
          'initial-value': '#faf6ff',
        },
      });
    },
    ({ addVariant }) => {
      addVariant(
        "touch",
        "@media (pointer: coarse) { & }",
      );
    },
    ({ addVariant }) => {
      addVariant(
        "touch-any",
        "@media (hover: hover) and (pointer: fine), (pointer: coarse) { & }",
      );
    },
  ],
};
