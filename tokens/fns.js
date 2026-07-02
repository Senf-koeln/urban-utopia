function deepen(obj) {
  const result = {};

  // For each object path (property key) in the object
  for (const objectPath in obj) {
    // Split path into component parts
    const parts = objectPath.split(".");

    // Create sub-objects along path as needed
    let target = result;
    while (parts.length > 1) {
      const part = parts.shift();
      target = target[part] = target[part] || {};
    }

    // Set value at end of path
    target[parts[0]] = obj[objectPath];
  }

  return result;
}

function createArray({ dictionary, platform }) {
  const arr = dictionary.allTokens;
  return JSON.stringify(arr);
}

function filterTokensByType(type, tokens) {
  const obj = tokens.reduce((acc, cur) => {
    if (cur.type === type) {
      acc[cur.path.join(".")] = `var(--${cur.name}, ${cur.value})`;
    }
    return acc;
  }, {});

  const deep = deepen(obj);
  return deep;
}

function mapFontWeightsToCss(lineHeight) {
  switch (lineHeight) {
    case "Thin":
      return 100;
    case "Extra Light":
      return 200;
    case "Light":
      return 300;
    case "Regular":
      return 400;
    case "Medium":
      return 500;
    case "SemiBold":
      return 600;
    case "Bold":
      return 700;
    case "ExtraBold":
      return 800;
    case "Black":
      return 900;

    default:
      throw new Error(`invalid lineHeight: ${lineHeight}`);
  }
}

module.exports = { createArray, filterTokensByType, mapFontWeightsToCss };
