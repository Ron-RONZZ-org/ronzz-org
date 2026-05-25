/**
 * Escape LIKE wildcards so user-provided search strings do not match
 * unintended rows. Escapes backslash first, then `%` → `\%` and `_` → `\_`.
 *
 * Backslash must be escaped before wildcards so that a user input like
 * `\%` is treated as literal backslash + literal percent, not as
 * escaped backslash + wildcard percent.
 */
export function escapeLike(term: string): string {
  return term.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&")
}
