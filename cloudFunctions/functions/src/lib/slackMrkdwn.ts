/** Converts GitHub-style markdown from LLM output into Slack mrkdwn. */
export function markdownToSlackMrkdwn(text: string): string {
  if (!text?.trim()) return "";

  let s = text.trim();

  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<$2|$1>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "*$1*");
  s = s.replace(/__([^_]+)__/g, "*$1*");
  s = s.replace(/^#{1,6}\s+(.+)$/gm, "*$1*");

  s = s
    .split("\n")
    .map((line) => {
      const bulletMatch = line.match(/^(\s*)(?:[*\-+]|\d+\.)\s+(.*)$/);
      if (!bulletMatch) return line;
      const indent = bulletMatch[1].length;
      const content = bulletMatch[2];
      const nested = indent >= 2 ? "    " : "";
      return `${nested}• ${content}`;
    })
    .join("\n");

  return escapeSlackMrkdwn(s);
}

/** Plain-text preview for Slack `text` fallback (notifications). */
export function slackMrkdwnToPlain(text: string): string {
  return text
    .replace(/<([^|>]+)\|([^>]+)>/g, "$2 ($1)")
    .replace(/<(https?:\/\/[^>]+)>/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function isSlackMrkdwnLink(part: string): boolean {
  return /^<(https?:\/\/|mailto:)[^>\n]+>$/i.test(part);
}

function escapeSlackMrkdwn(text: string): string {
  const parts = text.split(/(<[^>\n]+>)/g);
  return parts
    .map((part) => {
      if (isSlackMrkdwnLink(part)) return part;
      return part
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    })
    .join("");
}
