# Release Checklist — Dastresa 1.2.1 (Accessible Chrome)

**Goal:** Ship UI chrome polish on top of 1.2.0 Understand — same trust rules: offline, private, opt-in.

## A. Product truth (must match listing)

- [x] Opt-in activation (`extensionActive` default false)
- [x] Safe visual defaults (theme `normal`, no forced large buttons/zoom)
- [x] Per-site disable (`disabledSites` + `sitePreferences.enabled`)
- [x] Accessibility profiles
- [x] Semantic analysis / forms / page type stay local
- [x] Persian + English UI; default settings locale `fa`
- [x] Chrome `default_locale` = `fa`
- [x] `uiChrome` light/dark for popup / toolbar / tour / options
- [x] Settings via `chrome.storage.local` only

## B. Brand & store assets

- [x] Brand / store / privacy docs present
- [ ] Host privacy policy HTTPS URL in CWS
- [ ] Fresh screenshots: popup light+dark, toolbar chip+panel, options, reader TOC

## C. Engineering gate

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run pack:mvp
npm run build:firefox
npm run pack:firefox
```

Firefox details: `docs/FIREFOX_RELEASE.md` (Chrome zip unchanged; Firefox zip is separate for AMO).

Smoke `dist/` unpacked:

- [ ] Enable → toolbar chip + panel (light/dark)
- [ ] Language in Look & profile updates popup + toolbar labels
- [ ] More panel scrolls; system actions reachable
- [ ] Options page matches chrome; tour replay works
- [ ] Upgrade from 1.2.0 storage → settings preserved

## D. Package

```bash
npm run build
npm run pack:mvp
```

Upload `release/dastresa-mvp-1.2.1.zip` only.

## E. CWS form

- [ ] Listing / permissions / privacy URL / no remote code
- [ ] Prefer Trusted testers before Public

## F. Guardrails

- [ ] Do not announce AI/cloud features
