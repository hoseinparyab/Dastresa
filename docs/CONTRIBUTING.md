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

## Commit messages

Husky enforces [Conventional Commits](https://www.conventionalcommits.org/) on every commit:

```text
type(scope): short summary in imperative mood
```

**Types:** `feat` · `fix` · `docs` · `style` · `refactor` · `perf` · `test` · `build` · `ci` · `chore` · `revert`

**Scopes (required preference):** `toolbar` · `popup` · `options` · `onboarding` · `settings` · `reader` · `speech` · `focus` · `zoom` · `summary` · `a11y` · `i18n` · `core` · `content` · `background` · `ui` · `deps` · `release` · `husky` · `lint` · `test` · `docs` · `ci`

**Examples:**

```text
feat(toolbar): improve collapsed chip for light and dark chrome
fix(popup): apply locale changes to the active tab
chore(husky): tighten commitlint scopes for Dastresa
docs: clarify conventional commit scopes
```

**Hooks:**

| Hook | What it runs |
| --- | --- |
| `pre-commit` | `lint-staged` (ESLint + Prettier on staged files) |
| `commit-msg` | `commitlint` (conventional message) |
| `pre-push` | `typecheck` + `lint` |

After `npm install`, `prepare` wires Husky automatically (`core.hooksPath=.husky/_`).

## Do not implement (yet)

Packages under `src/future/` are extension points only. Do not add AI/cloud/OCR implementations without an explicit roadmap issue.
