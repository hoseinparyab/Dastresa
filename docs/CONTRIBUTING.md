# Contribution Guide

Thanks for helping make the web more accessible.

## Process

1. Fork and create a feature branch
2. Keep PRs focused on one module/concern
3. Add/adjust tests for behavior changes
4. Run `npm run lint && npm run typecheck && npm test`
5. Open a PR using the template

## Code standards

- TypeScript strict mode
- Feature-first boundaries
- WCAG 2.2 AAA intent for extension UI (48×48 targets, keyboard, contrast)
- No network calls, analytics, or cloud dependencies in MVP

## Do not implement (yet)

Packages under `src/future/` are extension points only. Do not add AI/cloud/OCR implementations without an explicit roadmap issue.
