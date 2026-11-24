import cors from "cors";
import { error as loggerError } from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";
import { slackWebhook } from "./lib/slackWebhook";

type HttpHandler = Parameters<typeof onRequest>[0];
type HttpRequest = Parameters<HttpHandler>[0];
type HttpResponse = Parameters<HttpHandler>[1];

const corsHandler = cors({ origin: "*" });

function readBodyString(body: unknown, key: string, maxLen: number): string {
  if (typeof body !== "object" || body === null) return "";
  const value = Reflect.get(body, key);
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

const handler = (req: HttpRequest, res: HttpResponse) => {
  return corsHandler(req, res, async () => {
    try {
      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Methods", "POST");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        res.status(405).json({ error: "Method Not Allowed" });
        return;
      }

      const webhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (!webhookUrl) {
        res.status(503).json({ error: "Contact form is not configured" });
        return;
      }

      const name = readBodyString(req.body, "name", 200);
      const email = readBodyString(req.body, "email", 320);
      const organization = readBodyString(req.body, "organization", 200);
      const message = readBodyString(req.body, "message", 5000);
      const source = readBodyString(req.body, "source", 100);

      if (!email.includes("@")) {
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
      const err = error instanceof Error ? error : new Error(String(error));
      loggerError("onUtopiaContactRequest error", err);
      res.status(500).json({ error: "Failed to submit contact request" });
    }
  });
};

export const onUtopiaContactRequest = onRequest(
  {
    region: "europe-west1",
    timeoutSeconds: 30,
    memory: "256MiB",
  },
  handler,
);
