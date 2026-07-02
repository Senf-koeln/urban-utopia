type SlackField = { label: string; value: string };

export async function slackWebhook({
  webhookUrl,
  title,
  fields,
  bodyMarkdown,
}: {
  webhookUrl: string;
  title?: string;
  fields?: SlackField[];
  bodyMarkdown?: string;
}) {
  const blocks: Record<string, unknown>[] = [];

  if (title) {
    blocks.push({
      type: "header",
      text: { type: "plain_text", text: title },
    });
  }

  const fieldList = fields ?? [];
  if (fieldList.length > 0) {
    blocks.push({
      type: "section",
      fields: fieldList.map((f) => ({
        type: "mrkdwn",
        text: `*${f.label}:*\n${f.value}`,
      })),
    });
  }

  if (bodyMarkdown?.trim()) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: bodyMarkdown.trim() },
    });
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks }),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: HTTP ${response.status}`);
  }
}
