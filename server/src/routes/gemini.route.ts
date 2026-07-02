import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { handleGemini } from "../services/geminiService.js";

export function createGeminiRouter(): Router {
  const router = createRouter();

  router.post("/", async (req: Request, res: Response) => {
    try {
      const result = await handleGemini(req.body);

      if (Buffer.isBuffer(result)) {
        res.set("Content-Type", "image/png");
        res.send(result);
        return;
      }

      res.set("Content-Type", "text/plain; charset=utf-8");
      res.send(result);
    } catch (error) {
      console.error("[api/gemini]", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Gemini request failed",
      });
    }
  });

  return router;
}
