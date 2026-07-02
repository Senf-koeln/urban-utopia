import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { slackWebhook } from "../services/slackWebhook.js";

function asTrimmedString(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

export function createContactRouter(): Router {
  const router = createRouter();

  router.post("/", async (req: Request, res: Response) => {
    try {
      const webhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (!webhookUrl) {
        res.status(503).json({ error: "Contact form is not configured" });
        return;
      }

      const name = asTrimmedString(req.body?.name, 200);
      const email = asTrimmedString(req.body?.email, 320);
      const organization = asTrimmedString(req.body?.organization, 200);
      const message = asTrimmedString(req.body?.message, 5000);
      const source = asTrimmedString(req.body?.source, 100);

      if (!email || !email.includes("@")) {
        res.status(400).json({ error: "A valid email is required" });
        return;
      }

      if (!message) {
        res.status(400).json({ error: "message is required" });
        return;
      }

      await slackWebhook({
        webhookUrl,
        title: "Urban Utopia — neue Anfrage",
        fields: [
          ...(name ? [{ label: "Name", value: name }] : []),
          { label: "E-Mail", value: email },
          ...(organization
            ? [{ label: "Organisation", value: organization }]
            : []),
          ...(source ? [{ label: "Quelle", value: source }] : []),
        ],
        bodyMarkdown: message,
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("[api/contact]", error);
      res.status(500).json({ error: "Failed to submit contact request" });
    }
  });

  return router;
}
