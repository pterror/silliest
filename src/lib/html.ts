const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHTML(str: string): string {
  return str.replace(/[&<>"']/g, (match) => HTML_ESCAPE_MAP[match] ?? match);
}
