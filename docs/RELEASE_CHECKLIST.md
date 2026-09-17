# Release Checklist — Dastresa 1.2.0 (Understand)

**Goal:** Ship Understand layer while keeping 1.1.x MVP behavior: offline, private, opt-in accessibility.

## A. Product truth (must match listing)

- [x] Opt-in activation (`extensionActive` default false)
- [x] Safe visual defaults (theme `normal`, no forced large buttons/zoom)
- [x] Per-site disable (`disabledSites` + `sitePreferences.enabled`)
- [x] Accessibility profiles (presets → settings, Custom preserves tweaks)
- [x] Semantic analysis / forms / page type stay local (no analytics)
- [x] Persian + English UI strings
- [x] Settings persisted only via `chrome.storage.local`
- [x] Schema migration v2 preserves 1.1.x settings

## B. Brand & store assets

- [x] Brand foundation locked — `docs/BRAND.md`
- [x] Store copy EN/FA — `docs/STORE_LISTING.md`
- [x] Privacy policy draft — `docs/PRIVACY.md`
- [x] Extension icons 16/32/48/128 — `public/icons/`
- [ ] Host privacy policy on HTTPS and paste URL into CWS
- [ ] Capture 3–5 screenshots (popup, toolbar, reader TOC, focus, profiles)
- [ ] Optional: 440×280 small promo tile from `docs/brand/icon-master.png`

## C. Engineering gate

Run from repo root:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run pack:mvp
```

- [ ] All commands pass on a clean machine
- [ ] Load `dist/` unpacked in Chrome and smoke-test:
  - Fresh install → page unchanged until Enable
  - Enable → toolbar appears
  - Theme Normal → page not wrecked
  - Reader → TOC / prev-next / progress
  - Profile Low vision → larger text + high contrast
  - Disable site → stays off after reload
  - Upgrade from 1.1.1 storage → settings preserved
  - Disable on this site → toolbar gone on that host only
  - Exit → global off
  - FA locale → popup/toolbar RTL labels
  - Reading Focus cursor visible above site dialogs

## D. Package for upload

```bash
npm run build
npm run pack:mvp
```

Upload the generated zip from `release/` (not the whole repo).

## E. Chrome Web Store form

- [ ] Single purpose statement matches STORE_LISTING
- [ ] Permission justifications pasted
- [ ] Privacy policy URL
- [ ] “Not sold to third parties” / no remote code attestations
- [ ] Distribution: Unlisted or Trusted testers first (recommended), then Public

## F. Post-submit brand guardrails

- [ ] Do not announce AI/cloud features
- [ ] Support replies use calm voice from `docs/BRAND.md`
- [ ] File bugs for site breakage as P0 (trust > features)

## Release owner sign-off

| Role | Name | Date | OK |
|------|------|------|----|
| Product | | | ☐ |
| Eng | | | ☐ |
| Brand | | | ☐ |
