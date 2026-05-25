/**
 * Escape LIKE wildcards so user-provided search strings do not match
 * unintended rows. Replaces `%` → `\%` and `_` → `\_`.
 */
export function escapeLike(term: string): string {
  return term.replace(/[%_]/g, "\\$&")
}
