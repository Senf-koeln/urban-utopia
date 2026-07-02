export type ContactRequestPayload = {
  name: string;
  email: string;
  organization: string;
  message: string;
  source: string;
};

export async function notifyContactRequestSlack(
  payload: ContactRequestPayload,
): Promise<void> {
  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack notification failed: HTTP ${response.status}`);
  }
}
