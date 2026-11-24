import { slackMrkdwnToPlain } from "./slackMrkdwn";

function buildSlackFallbackText({
  title,
  fields,
  markdownSections,
  bodyMarkdown,
  context,
}: {
  title?: string;
  fields?: { label: string; value: string }[];
  markdownSections?: string[];
  bodyMarkdown?: string;
  context?: string;
}): string {
  const parts: string[] = [];
  if (title) parts.push(title);
  for (const f of fields ?? []) {
    parts.push(`${f.label}: ${slackMrkdwnToPlain(f.value)}`);
  }
  for (const md of markdownSections?.filter(Boolean) ?? []) {
    parts.push(slackMrkdwnToPlain(md));
  }
  if (bodyMarkdown) parts.push(slackMrkdwnToPlain(bodyMarkdown));
  if (context) parts.push(slackMrkdwnToPlain(context));
  return parts.join("\n\n");
}

export async function slackWebhook({
  webhookUrl,
  title,
  fields,
  context,
  bodyMarkdown,
  markdownSections,
}: {
  webhookUrl: string;
  title?: string;
  fields?: { label: string; value: string }[];
  context?: string;
  bodyMarkdown?: string;
  /** Plain mrkdwn sections (no *Label:* prefix), e.g. report text before a link */
  markdownSections?: string[];
}) {
  const blocks: Record<string, unknown>[] = [];
  const fieldList = fields ?? [];

  if (title) {
    blocks.push({
      type: "header",
      text: { type: "plain_text", text: title },
    });
  }

  if (fieldList.length > 0) {
    blocks.push({
      type: "section",
      fields: fieldList.map((f) => ({
        type: "mrkdwn",
        text: `*${f.label}:*\n${f.value}`,
      })),
    });
  }

  const sections = markdownSections?.filter(Boolean) ?? [];
  for (let i = 0; i < sections.length; i++) {
    if (i > 0) {
      blocks.push({ type: "divider" });
    }
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: sections[i] },
    });
  }

  if (bodyMarkdown) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: bodyMarkdown },
    });
  }

  if (context) {
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: context }],
    });
  }

  const fallbackText = buildSlackFallbackText({
    title,
    fields: fieldList,
    markdownSections: sections,
    bodyMarkdown,
    context,
  });

  let response: Response;
  try {
    response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: fallbackText, blocks }),
    });
  } catch (err) {
    throw new Error(
      `Slack webhook network error: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err },
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Slack webhook failed: HTTP ${response.status} — ${body}`);
  }
}
