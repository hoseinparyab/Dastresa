# Dastresa — Brand Foundation (MVP)

**Status**: Locked for MVP release  
**Owner**: Brand + Product  
**Last updated**: 2026-07-21

---

## Purpose

Make the open web readable and usable for people who are left behind by dense, low-contrast, or confusing websites — especially older adults, low-vision users, and people with low digital literacy — without taking their data off the device.

## Vision

A web where accessibility help is local, trustworthy, and always within one calm toolbar — not locked behind accounts, AI upsells, or cloud surveillance.

## Mission

Ship an offline Chrome accessibility layer that lets people enlarge text, improve contrast, hear pages aloud, and focus on reading — privately, on any website.

## Values

1. **Dignity first** — Controls are large, calm, and respectful; never childish or medicalizing.
2. **Privacy is the product** — No tracking, no cloud sync in MVP, no remote AI. Settings stay on-device.
3. **Clarity over cleverness** — Short labels, honest promises, opt-in activation.
4. **Site safety** — Never break the page by default; Normal look until the user asks for more.
5. **Bilingual honesty** — Persian and English are first-class; the brand name «دسترسا / Dastresa» is one identity.

## Personality

- **Steady** — Reliable, not flashy  
- **Warm** — Helpful without shouting  
- **Direct** — Plain language for elderly users  

## Promise

> Dastresa makes any website easier to read and use on your device — offline, private, with one toolbar.

## Non-promises (protect the brand)

Do **not** market MVP as:

- A screen reader replacement  
- An AI assistant / copilot  
- A cloud sync or account product  
- A banking/government autofill product  

Future modules under `src/future/` are engineering placeholders, not public brand claims.

---

## Visual identity

| Token | Value | Use |
|-------|-------|-----|
| Primary navy | `#0f172a` | Extension chrome background |
| Surface | `#1e293b` | Cards / panels |
| Accent cyan | `#38bdf8` | Focus, CTAs, brand mark |
| Text | `#f8fafc` | Primary copy |
| Muted | `#cbd5e1` | Secondary copy (AA on navy) |
| Danger | `#f87171` | Exit / destructive |
| Success | `#4ade80` | Active status |

**Typography (MVP):** Tahoma → Segoe UI → system (Persian-first stack). Do not ship unloaded webfonts.

**Logo / icons:** `public/icons/icon-{16,32,48,128}.png` — cyan reading mark on navy. Master: `docs/brand/icon-master.png`.

**Clear space:** Keep the mark inside a quiet navy field; no competing gradients on store icons.

---

## Voice & messaging

### Tagline

| Locale | Line |
|--------|------|
| EN | Easier reading. Offline. Private. |
| FA | خواندن آسان‌تر. آفلاین. خصوصی. |

### One-liner

| Locale | Line |
|--------|------|
| EN | Make every website easier to read and use. |
| FA | هر وب‌سایتی را خوانا و ساده‌تر کنید. |

### Tone by surface

| Surface | Tone |
|---------|------|
| Popup / options | Supportive, short sentences |
| Toolbar | Ultra-short labels (مطالعه / بخوان / تم) |
| Store listing | Trust + privacy first, then features |
| Errors / exit | Calm and reversible (“Exit” is safe) |

### Words to prefer

Enable, Reset page, Offline, Private, On this site, Normal (browser)

### Words to avoid in MVP

AI, cloud, sync, account, smart assistant, surveillance synonyms, “fixes your computer”

---

## Brand checklist before any public post

- [ ] Promise matches shipped behavior (opt-in, normal defaults)  
- [ ] Persian + English screenshots if both locales are claimed  
- [ ] Privacy policy URL live and linked in the store  
- [ ] No AI/cloud claims in title, screenshots, or description  
- [ ] Icons are the navy/cyan Dastresa mark (not placeholder dots)  
