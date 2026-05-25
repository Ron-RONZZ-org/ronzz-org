/**
 * Escape special XML characters in a string.
 * Replaces &, <, >, " with their XML entity equivalents.
 */
export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
