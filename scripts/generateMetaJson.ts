import fs from "node:fs";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";

export function generateMetaJson(version: string): Plugin {
  let resolvedOutDir: string;

  return {
    name: "generate-meta-json",
    apply: "build" as const,
    configResolved(config: ResolvedConfig) {
      resolvedOutDir = config.build.outDir;
    },
    closeBundle() {
      if (!resolvedOutDir) {
        console.error(
          "[vite] Error: build.outDir could not be determined for generateMetaJson plugin.",
        );
        return;
      }
      const meta = { version, buildDate: Date.now() };
      const filePath = path.resolve(resolvedOutDir, "meta.json");

      try {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(meta, null, 2));
        console.log(`[vite] Generated meta.json directly in ${filePath}`);
      } catch (error) {
        console.error(`[vite] Error writing meta.json to dist: ${error}`);
      }
    },
  };
}
