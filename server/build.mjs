import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(resolve(__dirname, "package.json"), "utf8"),
);

const npmDeps = Object.keys(pkg.dependencies ?? {}).filter(
  (name) => !name.startsWith("senf-") && name !== "@senf",
);

await build({
  entryPoints: [resolve(__dirname, "src/index.ts")],
  outfile: resolve(__dirname, "dist/index.js"),
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  external: npmDeps.flatMap((name) => [name, `${name}/*`]),
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      "import { fileURLToPath as __fileURLToPath } from 'node:url';",
      "import { dirname as __dirnameFn } from 'node:path';",
      "const require = __createRequire(import.meta.url);",
      "const __filename = __fileURLToPath(import.meta.url);",
      "const __dirname = __dirnameFn(__filename);",
    ].join("\n"),
  },
  logLevel: "info",
  sourcemap: true,
  legalComments: "none",
});
