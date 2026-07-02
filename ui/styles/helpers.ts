export type RGB = [number, number, number];
export type RGBA = [...RGB, number];
export type HSL = [number, number, number];
export type HSLA = [...HSL, number];

export type ColorPallet = {
  [key: string]: HSL | HSLA;
};

export type ThemeColors = {
  [key: string]: string;
};

export const hsla = (h: number, s: number, l: number, a = 1) =>
  `hsla(${h}, ${s}%, ${l}%, ${a})`;

export const hex2hsl = (hex: string): HSL => {
  if (!hex) return [0, 0, 0];
  const value = hex.replace("#", "");

  const [r, g, b] = value
    .match(/.{1,2}/g)
    ?.map((v) => Number.parseInt(v, 16) / 255) as RGB;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        break;
    }

    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};

export const hex2hsla = (hex: string, alpha = 1): string => {
  if (!hex) return `hsla(0, 0%, 0%, ${alpha})`;
  let value = hex.replace("#", "");

  // If HEX includes alpha, parse and convert it to a number between 0 and 1
  if (value.length === 8) {
    const alphaHex = value.substring(6);
    alpha = Number.parseInt(alphaHex, 16) / 255;
    value = value.substring(0, 6); // Update value to exclude alpha for RGB conversion
  }

  const [r, g, b] = value
    .match(/.{1,2}/g)
    ?.map((v) => Number.parseInt(v, 16) / 255) as RGB;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  // Convert the h, s, and l values from 0-1 scale to 0-360 for h, and 0-100% for s and l
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
};

export const parseHSLA = (hslaString: string): HSLA | null => {
  // This regular expression matches the HSLA pattern and captures the numbers
  const match = hslaString.match(
    /hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/,
  );
  if (!match) return null;

  // Parse the captured values into numbers
  const [h, s, l, a] = match.slice(1).map(Number);
  return [h, s, l, a];
};

export const hsla2hsl = (hslaString: string): HSL | null => {
  const hsla = parseHSLA(hslaString);
  if (!hsla) return null;

  // Destructure the HSLA array and omit the alpha value
  const [h, s, l] = hsla;
  // Return the HSL values
  return [h, s, l];
};

/**
 * Converts HSLA color string to HEX with alpha
 *
 * @param hslaColor - HSLA color string in either format:
 *   - Comma syntax: hsla(h, s%, l%, a)
 *   - Space syntax: hsla(h s% l% / a)
 *
 * @returns Hex color with alpha in format #RRGGBBAA
 *
 * @example
 * // Returns "#FF0000FF" (red)
 * hslaToHex("hsla(0, 100%, 50%, 1)")
 *
 * // Also works with space syntax
 * hslaToHex("hsla(0 100% 50% / 1)")
 *
 * // Handles negative hue values (-1° = 359°)
 * hslaToHex("hsla(-1, 100%, 50%, 1)") // Returns "#FF0000FF"
 */
export function hslaToHex(hslaColor: string | null | undefined): string {
  // Support both comma-separated and space-separated formats
  // Handle both hsla(h,s%,l%,a) and hsla(h s% l% / a) formats
  // Updated regex to support negative hue values
  const hexRegex = /^#([A-Fa-f0-9]{6}([A-Fa-f0-9]{2})?)$/;

  if (hslaColor && hexRegex.test(hslaColor)) {
    return hslaColor;
  }

  const hslRegexComma =
    /hsla?\(([-\d]+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/;
  const hslRegexSpace =
    /hsla?\(([-\d]+)\s+([\d.]+)%\s+([\d.]+)%(?:\s*\/\s*([\d.]+))?\)/;

  const match: RegExpMatchArray | null =
    hslaColor?.match(hslRegexComma) || hslaColor?.match(hslRegexSpace) || null;

  if (!match) {
    // console.warn("Invalid HSLA color format:", hslaColor);
    return "#000000";
  }

  // Normalize hue value to the range [0-359]
  // This formula efficiently handles both negative hues and values outside the normal range:
  // 1. (hue % 360) - Gets the equivalent angle within one rotation (could be negative)
  // 2. + 360 - Ensures the result is positive
  // 3. % 360 - Handles cases where adding 360 exceeds one rotation
  const hue: number = ((Number.parseInt(match[1]) % 360) + 360) % 360;

  const saturation: number = Number.parseFloat(match[2]) / 100;
  const lightness: number = Number.parseFloat(match[3]) / 100;
  const alpha: number = match[4] ? Number.parseFloat(match[4]) : 1;

  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const huePrime = hue / 60;
  const secondComponent = chroma * (1 - Math.abs((huePrime % 2) - 1));
  const lightnessAdjustment = lightness - chroma / 2;

  let red: number;
  let green: number;
  let blue: number;

  if (huePrime >= 0 && huePrime < 1) {
    red = chroma;
    green = secondComponent;
    blue = 0;
  } else if (huePrime >= 1 && huePrime < 2) {
    red = secondComponent;
    green = chroma;
    blue = 0;
  } else if (huePrime >= 2 && huePrime < 3) {
    red = 0;
    green = chroma;
    blue = secondComponent;
  } else if (huePrime >= 3 && huePrime < 4) {
    red = 0;
    green = secondComponent;
    blue = chroma;
  } else if (huePrime >= 4 && huePrime < 5) {
    red = secondComponent;
    green = 0;
    blue = chroma;
  } else {
    red = chroma;
    green = 0;
    blue = secondComponent;
  }

  red = Math.round((red + lightnessAdjustment) * 255);
  green = Math.round((green + lightnessAdjustment) * 255);
  blue = Math.round((blue + lightnessAdjustment) * 255);

  const alphaHex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  const redHex = red.toString(16).padStart(2, "0");
  const greenHex = green.toString(16).padStart(2, "0");
  const blueHex = blue.toString(16).padStart(2, "0");

  return `#${redHex}${greenHex}${blueHex}${alphaHex}`;
}

export const convertColorToHSL = (colorString: string): HSL | null => {
  // Check for HEX format
  if (/^#([A-Fa-f0-9]{6}([A-Fa-f0-9]{2})?)$/.test(colorString)) {
    return hex2hsl(colorString);
  }

  // Attempt to convert HSLA string format
  return hsla2hsl(colorString);
};

export const hsl2rgb = (hue: number, sat: number, lum: number): RGB => {
  const h = hue;
  const s = sat / 100;
  const l = lum / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number, k = (n + h / 30) % 12) =>
    Math.floor((l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)) * 255);
  return [f(0), f(8), f(4)];
};
export const rgb2hsl = (red: number, green: number, blue: number): HSL => {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const v = Math.max(r, g, b);
  const c = v - Math.min(r, g, b);
  const f = 1 - Math.abs(v + v - c - 1);
  const h =
    c && (v === r ? (g - b) / c : v === g ? 2 + (b - r) / c : 4 + (r - g) / c);
  return [
    Math.floor(60 * (h < 0 ? h + 6 : h)),
    Math.floor((f ? c / f : 0) * 100),
    Math.floor(((v + v - c) / 2) * 100),
  ];
};
export function hexToHSLA(hex, opacity) {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const cmin = Math.min(r, g, b);
  const cmax = Math.max(r, g, b);
  const delta = cmax - cmin;
  let h = 0;
  let s = 0;
  let l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `hsl(${h} ${s}% ${l}% / ${opacity})`;
}

export const rgbToHex = (red, green, blue) => {
  // Helper function to convert a single color component into a two-digit hex string
  const toHex = (colorValue) => {
    const hex = colorValue.toString(16);
    return hex.length === 1 ? `0${hex}` : hex; // Pad with zero if necessary
  };

  // Convert each color component and concatenate to form the full hex code
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
};

// console.log(rgbToHex(60, 60, 153)); // Expected output: #3c3c99

export const composite = (
  h: number,
  s: number,
  l: number,
  a: number,
  b: HSL = [0, 0, 100],
) => {
  const overlay = hsl2rgb(h, s, l);
  const background = hsl2rgb(...(b as RGB));
  return rgb2hsl(
    ...(overlay.map(
      (value, index) => a * value + (1 - a) * background[index],
    ) as RGB),
  ) as RGB;
};
const pad = (n: number, padding = 3) => String(n).padStart(padding, "0");

/**
 * Generates theme colors based on the given colors and luminance
 * @param colors Object with colors and their HSL values as an array.
 * @example { primary: [46, 100, 71]
 * @param luminance Array of luminance values.
 * @example [100, 75, 50, 25, 15, 10, 5];
 * @param mix HSL values to mix with, defaults to white, set to false to disable and only generate the base color as well as transparency.
 * @example [46, 100, 71]
 * @returns Object with colors and their HSLA values as string.
 * @example { 'primary-100': 'hsla(45, 100%, 98%, 1)', 'primary-100-tra': 'hsla(46, 100%, 71%, 0.05)', ... }
 */

export const generateRaw = (
  colors: ColorPallet,
  luminance: number[],
  mix: HSL | boolean = [0, 0, 100],
) => {
  const themeColors = {};
  Object.entries(colors).forEach(([name, color]) => {
    const [h, s, l] = color;
    const bw = !mix || (mix[0] === 0 && mix[1] === 0);
    if (!mix) themeColors[`${name}`] = [h, s, l, 1];
    luminance.forEach((lum, i) => {
      const index = i !== 0 && pad((10 - i) * 100);
      if (mix)
        themeColors[`${name}${index ? `-${index}` : ""}`] = composite(
          h,
          s,
          l,
          lum / 100,
          mix as HSL,
        ) as HSL;
      if (index && bw) themeColors[`${name}/${index}`] = [h, s, l, lum / 100];
    });
  });
  return themeColors;
};
export const generateThemeColors = (
  colors: ColorPallet,
  luminance: number[] = [100],
  mix: HSL | boolean = [0, 0, 100],
) => {
  const conv = Object.fromEntries(
    Object.entries(generateRaw(colors, luminance, mix)).map((e) => {
      e[1] = hsla(...(e[1] as HSLA));
      return e;
    }),
  );
  return conv as ThemeColors;
};

// legacy method
export const __generateThemeColor = (color: RGB) => {
  const raw: Record<string, HSL> = {};
  const pretty: Record<string, string> = {};
  const [h, s, l] = color || [0, 0, 0];

  const [min, max] = [20, 90];
  const clampedLum = Math.max(Math.min(l, max), min);

  const interpolate = (n: number, val: number, reverse = false) =>
    Array(n)
      .fill(0)
      .map((_, i, arr) => {
        const size = reverse ? arr.length - i - 1 : i;
        const interval = (clampedLum - val) / n;
        return Math.round(interval * size) + val;
      });

  const luminance = [
    ...interpolate(6, min - 20),
    clampedLum,
    ...interpolate(3, max + 5, true),
  ];
  const saturation = [
    ...Array(6).fill(s),
    s,
    ...interpolate(3, Math.min(80, s)),
  ];
  luminance.forEach((lum, i) => {
    const index = i !== 0 ? pad((10 - i) * 100) : 1000;
    raw[`${index}`] = [h, lum < 50 ? saturation[i] : s, lum];
    pretty[`${index}`] = hsla(h, lum < 50 ? saturation[i] : s, lum);
  });
  return {
    raw,
    color: pretty,
  };
};

export const interpolate = ({
  from,
  to,
  n,
  reverse,
}: {
  from: number;
  to: number;
  n: number;
  reverse?: boolean;
}) => {
  return Array(n)
    .fill(0)
    .map((_, i, arr) => {
      const size = reverse ? arr.length - i - 1 : i;
      const interval = (to - from) / n;
      return Math.round(interval * size) + from;
    });
};

/**
 * @deprecated Use the new generateThemeColor function instead
 * @param color
 * @returns
 */
export const generateThemeColor = (color: RGB) => {
  // return __generateThemeColor(color)
  const raw: Record<string, HSL> = {};
  const pretty: Record<string, string> = {};
  const [h, s, l] = color || [0, 0, 0];

  const [min, max] = [30, 89];
  const clamptedLum = Math.max(Math.min((l || 1) - 1, max), min);
  const lumVal =
    clamptedLum < 50
      ? Math.ceil(clamptedLum / 10)
      : Math.floor(clamptedLum / 10);
  const lumIndex = 9 - lumVal;

  const luminance = [
    ...interpolate({ n: lumVal, from: 12, to: clamptedLum }),
    clamptedLum,
    ...interpolate({ n: lumIndex, from: 95, to: clamptedLum, reverse: true }),
  ];

  const clampedSaturation = (() => {
    if (s < 80) return 90;
    if (h > 160 && h < 170) return 50;
    if (h > 155 && h < 180) return 60;
    if (h > 150 && h < 190) return 70;
    if (h > 145 && h < 200) return 80;
    return 90;
  })();

  const saturation = [
    ...interpolate({ n: lumVal, from: Math.min(90, s), to: s }),
    s,
    ...interpolate({
      n: lumIndex,
      from: Math.min(clampedSaturation, s),
      to: s,
      reverse: true,
    }),
  ];

  const hueRotation =
    h < 70 || (h > 270 && h < 360) ? 10 : h > 110 && h < 250 ? -10 : 0;

  const hue = [
    ...interpolate({ n: lumVal, from: h - hueRotation, to: h }),
    h,
    ...interpolate({
      n: lumIndex,
      from: h + hueRotation,
      to: h,
      reverse: true,
    }),
  ];

  luminance.forEach((lum, i) => {
    const index = (10 - i) * 100;
    raw[`${index}`] = [hue[i], saturation[i], lum];
    pretty[`${index}`] = hsla(...raw[`${index}`]);
  });

  const base = [lumVal, lumVal - 1, lumVal - 2, Math.max(lumVal - 4, 0)].map(
    (i) => ((10 - i) * 100).toString(),
  ) as [`${number}`, `${number}`, `${number}`, `${number}`];

  return {
    raw,
    color: pretty,
    baseIndex: lumIndex,
    base,
  };
};

export const getRelativeLuminance = (rgb: RGB) =>
  0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];

export const generateStaticColors = (colors: ThemeColors) =>
  console.log(`export default ${JSON.stringify(colors)}`);

export const logColor = (color: string, name: string) => {
  console.log(
    "%c  ",
    `background: ${color}; color: black; border-radius: 0.25rem;`,
    `${name}: ${color}`,
  );
};
export const logColors = (colors: ThemeColors) => {
  console.log(
    `%cGenerated ${Object.entries(colors).length} colors:`,
    "font-weight: bold",
  );
  Object.entries(colors).forEach(([name, color]) => logColor(color, name));
};

// export function adaptHexColorBrightness(hex, percent) {
//   let r = parseInt(hex.substring(1, 3), 16);
//   let g = parseInt(hex.substring(3, 5), 16);
//   let b = parseInt(hex.substring(5, 7), 16);

//   // Make the color lighter without increasing its brightness too much
//   r = Math.min(255, r + percent);
//   g = Math.min(255, g + percent);
//   b = Math.min(255, b + percent);

//   // Ensure the values are within bounds and convert each component back to hex
//   const rr = (r < 255 ? r : 255).toString(16).padStart(2, "0");
//   const gg = (g < 255 ? g : 255).toString(16).padStart(2, "0");
//   const bb = (b < 255 ? b : 255).toString(16).padStart(2, "0");

//   // Return the modified color in hex format
//   return `#${rr}${gg}${bb}`;
// }

export function adaptHSLAColorBrightness(hsla, lightnessChange) {
  const [hue, saturation, lightness, alpha] = hsla.match(/\d+\.?\d*/g);
  const newLightness = Math.min(
    100,
    Math.max(0, Number.parseFloat(lightness) + lightnessChange),
  );
  return `hsla(${hue}, ${saturation}%, ${newLightness}%, ${alpha})`;
}

export const checkIfHex = (color) => {
  const isHexColor = /^#([0-9A-F]{3}){1,2}$/i.test(color);
  if (isHexColor) {
    return true;
  }
  return false;
};

/**
 * Checks if a string is a valid HSLA color format
 * Supports both comma and space syntaxes, and negative hue values
 *
 * @param color - The color string to check
 * @returns boolean - Whether the string is a valid HSLA color
 */
export const checkIfHSLA = (color: string): boolean => {
  if (!color || typeof color !== "string") return false;

  // Match comma-separated format: hsla(0, 100%, 50%, 1)
  const commaPattern =
    /^hsla?\(\s*([-\d]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*,\s*([\d.]+)\s*\)$/i;

  // Match space-separated format: hsla(0 100% 50% / 1)
  const spacePattern =
    /^hsla?\(\s*([-\d]+)\s+([\d.]+)%\s+([\d.]+)%(?:\s*\/\s*([\d.]+))?\s*\)$/i;

  return commaPattern.test(color) || spacePattern.test(color);
};

export const adaptColorBrightness = (color, value) => {
  if (checkIfHex(color)) {
    const hsla = hex2hsla(color);
    return adaptHSLAColorBrightness(hsla, value - 5);
  }
  if (checkIfHSLA(color)) {
    return adaptHSLAColorBrightness(color, value);
  }
};
