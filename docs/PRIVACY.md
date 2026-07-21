# Privacy Policy — Dastresa

**Effective date:** 2026-07-21  
**Product:** Dastresa Chrome extension (Manifest V3)  
**Publisher:** Najino Agency  

This policy describes how Dastresa handles information. It is written for Chrome Web Store compliance and for users who need plain language.

## Summary

Dastresa is an **offline accessibility tool**. It does **not** collect personal browsing data, does **not** sell data, and does **not** send page content to remote servers.

## What Dastresa does

On websites you visit (after you enable it), Dastresa can:

- Change how text looks (size, theme, focus aids)
- Read text aloud using your browser’s built-in speech voices
- Show a floating accessibility toolbar

These features run **inside your browser** on your device.

## Data stored on your device

Settings are saved with Chrome’s `chrome.storage.local`, for example:

- Whether the extension is enabled
- Theme, zoom, speech preferences
- Reading focus options
- Toolbar position
- Sites you chose to disable
- Language (Persian / English)

This data stays on your device unless you sync Chrome settings through your own Google account (that sync is controlled by Google Chrome, not by Dastresa servers — Dastresa has none).

## What we do not collect

Dastresa’s extension code does **not**:

- Run analytics or advertising trackers
- Record the websites you visit to a Dastresa backend
- Upload page content, passwords, or form data
- Require an account
- Use remote AI APIs

## Permissions (why they exist)

| Permission | Reason |
|------------|--------|
| `storage` | Save your accessibility preferences on the device |
| Access to websites (`http`/`https`) | Apply the reading tools on pages you open |
| `activeTab` | Talk to the current tab when you use the popup |

## Third parties

Dastresa does not embed third-party analytics SDKs. Speech uses the voices already installed in your operating system / browser.

## Children’s privacy

Dastresa is a general accessibility tool and does not knowingly collect children’s personal information.

## Changes

If this policy changes, we will update the effective date on this page. Material changes will be reflected in the Chrome Web Store listing when required.

## Contact

For privacy questions about Dastresa, contact **Najino Agency** through the support channel listed on the Chrome Web Store listing (or the project repository maintainers).

---

**Hosting note for release:** Publish this document at a stable HTTPS URL (GitHub Pages, project site, or docs host) and paste that URL into the Chrome Web Store “Privacy policy” field before submitting.
