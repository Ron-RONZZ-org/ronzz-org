# Code Review — May 2026

## Summary
A full codebase review was conducted by @reviewer on 2026-05-24. Three GitHub issues were created:

- **#7 (Critical)**: PG dialect dead code, COUNT O(n), hard-delete, session auth raw SQL, plaintext session IDs, hardcoded admin password, near-zero test coverage
- **#8 (High)**: Sitemap soft-delete leak, token prefix entropy, datapoints pagination, CSP fallback, rate limiter shared store, i18n SSR race
- **#9 (Medium)**: Duplicate devDependencies, chart ResizeObserver duplication, createDataset shape duplication, search engine lifecycle, unused Result<T,E> type

## Quickest wins
- COUNT O(n) fixes (3 files, trivial regex replacements)
- Duplicate devDependencies removal
- Sitemap soft-delete filter (add one where clause)
- CSP unsafe-inline fallback (add one token to array)
- deleteResource soft-delete (change delete to update)
