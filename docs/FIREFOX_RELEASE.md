# Firefox / AMO release — Dastresa

Chrome Web Store packaging stays unchanged (`npm run build` + `npm run pack:mvp`).
This doc covers the **parallel** Firefox build for [addons.mozilla.org](https://addons.mozilla.org/developers/).

## Build & pack

```bash
npm run build:firefox
npm run pack:firefox
```

Outputs:

| Target | Zip |
|--------|-----|
| Chrome | `release/dastresa-mvp-<version>.zip` |
| Firefox | `release/dastresa-firefox-<version>.zip` |

`build:firefox` runs the normal Chrome Vite/CRX build, copies `dist/` → `dist-firefox/`, then patches `manifest.json`:

- Adds `browser_specific_settings.gecko.id` = `dastresa@najino.com`
- Sets `strict_min_version` = `121.0` (MV3 service worker)
- Removes `minimum_chrome_version`

## Local smoke test

1. Firefox → `about:debugging#/runtime/this-firefox`
2. **Load Temporary Add-on** → select `dist-firefox/manifest.json`
3. Open a normal `https://` page → Enable Dastresa from the popup
4. Check: toolbar chip, light/dark chrome, language switch, options page, reader/TTS basics
5. Restricted pages (`about:*`, AMO itself) will not inject — expected

## AMO submission (manual)

1. Create a developer account at [addons.mozilla.org/developers](https://addons.mozilla.org/developers/)
2. **Submit a New Add-on** → upload `release/dastresa-firefox-<version>.zip`
3. Listing: reuse copy from `docs/STORE_LISTING.md` (FA + EN)
4. Privacy policy URL: host `docs/PRIVACY.md` on HTTPS (same as CWS)
5. Justify broad `host_permissions` / content scripts: offline accessibility overlay on websites the user visits; no remote page upload
6. Source code: MIT repo or attach source zip if reviewers request it
7. Submit for review

Do **not** create a second Chrome listing for Firefox — this zip is AMO-only.

## Notes

- Runtime APIs use the `chrome.*` namespace (supported by Firefox for compatibility).
- Keep Chrome and Firefox version numbers in sync via `package.json` / built manifest.
