import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";

const PORT = Number(
  process.env.PORT ?? (process.env.NODE_ENV === "production" ? 80 : 8082),
);

/** Vite build at `dist/`. Resolves from bundled `server/dist/index.js`. */
const STATIC_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../dist",
);

export async function startServer(): Promise<void> {
  const app = createApp(STATIC_DIR);

  app.listen(PORT, () => {
    console.log(`[server] listening on :${PORT} (static: ${STATIC_DIR})`);
  });
}
