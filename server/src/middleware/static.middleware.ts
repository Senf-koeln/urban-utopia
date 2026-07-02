import path from "node:path";
import express, { type Express, type RequestHandler } from "express";

/** Express 5 path-to-regexp catch-all for SPA client-side routes. */
const SPA_FALLBACK_PATH = "/{*splat}";

export function mountStaticAssets(app: Express, staticDir: string): void {
  app.use(
    "/assets",
    express.static(path.join(staticDir, "assets"), {
      immutable: true,
      maxAge: "1y",
    }),
  );

  app.use(
    express.static(staticDir, {
      setHeaders: (res, filePath) => {
        const base = path.basename(filePath);
        if (base === "index.html" || base === "meta.json") {
          res.setHeader("Cache-Control", "no-store");
        }
      },
    }),
  );
}

export function createSpaFallbackMiddleware(staticDir: string): RequestHandler {
  return (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.sendFile(path.join(staticDir, "index.html"));
  };
}

export function registerSpaFallback(app: Express, staticDir: string): void {
  const fallback = createSpaFallbackMiddleware(staticDir);
  app.get(SPA_FALLBACK_PATH, fallback);
}
