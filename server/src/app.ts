import express, { type Express } from "express";
import { createContactRouter } from "./routes/contact.route.js";
import { createGeminiRouter } from "./routes/gemini.route.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import {
  mountStaticAssets,
  registerSpaFallback,
} from "./middleware/static.middleware.js";

export function createApp(staticDir: string): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "50mb" }));

  app.use("/api/gemini", createGeminiRouter());
  app.use("/api/contact", createContactRouter());

  mountStaticAssets(app, staticDir);
  registerSpaFallback(app, staticDir);
  app.use(errorMiddleware);

  return app;
}
