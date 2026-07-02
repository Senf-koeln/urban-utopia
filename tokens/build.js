const StyleDictionaryPackage = require("style-dictionary");
const { createArray, mapFontWeightsToCss } = require("./fns");

// HAVE THE STYLE DICTIONARY CONFIG DYNAMICALLY GENERATED

StyleDictionaryPackage.registerFormat({
  name: "css/variables",
  formatter(dictionary, config) {
    return `${this.selector} {\n${dictionary.allProperties
      .filter((prop) => prop.type !== "typography")
      .map((prop) => `  --${prop.name}: ${prop.value};`)
      .join("\n")}\n}`;
  },
});

StyleDictionaryPackage.registerTransform({
  name: "sizes/px",
  type: "value",
  matcher(prop) {
    // You can be more specific here if you only want 'em' units for font sizes
    const categories = [
      "fontSizes",
      // "spacing",
      "borderRadius",
      "borderWidth",
      // "sizing",
      "shadows",
      "borders",
      // "body",
      // "heading",
      "fontWeights",
      "fontFamilies",
    ];
    return (
      categories.includes(prop.attributes.category) ||
      categories.includes(prop.type)
    );
  },
  transformer(prop) {
    const { original } = prop;
    switch (prop.type) {
      case "boxShadow":
        return !Array.isArray(original.value)
          ? `${original.value.type === "innerShadow" ? "inset" : ""} ${
              original.value.x
            } ${original.value.y}px ${original.value.blur}px ${
              original.value.spread
            }px ${original.value.color}`
          : original.value.map(
              (val) =>
                `${val.type === "innerShadow" ? "inset" : ""} ${val.x}px ${
                  val.y
                }px ${val.blur}px ${val.spread}px ${val.color}`
            );
      case "fontFamilies": {
        return `${original.value}, -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      }
      case "fontWeights":
        return mapFontWeightsToCss(original.value);

      default:
        // You can also modify the value here if you want to convert pixels to ems
        return `${parseFloat(prop.original.value)}px`;
    }
  },
});

function getStyleDictionaryConfig(theme) {
  return {
    source: [`tokens/${theme}.json`],
    format: {
      createArray,
    },
    platforms: {
      web: {
        transforms: ["attribute/cti", "name/cti/kebab", "sizes/px"],
        buildPath: `output/`,
        files: [
          {
            destination: `${theme}.json`,
            format: "createArray",
          },
          {
            destination: `${theme}.css`,
            format: "css/variables",
            selector: `.${theme}-theme`,
          },
        ],
      },
    },
  };
}

console.log("Build started...");

// PROCESS THE DESIGN TOKENS FOR THE DIFFEREN BRANDS AND PLATFORMS

["global", "light", "dark"].forEach((theme) => {
  console.log("\n==============================================");
  console.log(`\nProcessing: [${theme}]`);

  const StyleDictionary = StyleDictionaryPackage.extend(
    getStyleDictionaryConfig(theme)
  );

  StyleDictionary.buildPlatform("web");

  console.log("\nEnd processing");
});

console.log("\n==============================================");
console.log("\nBuild completed!");
