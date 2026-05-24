/**
 * Format a number for axis tick labels.
 * Shows K for thousands, M for millions, or the raw number.
 */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return Number.isInteger(n) ? n.toString() : n.toFixed(1)
}
