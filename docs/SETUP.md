# Setup Guide

## Prerequisites

- Node.js 20+
- npm 10+
- Google Chrome 116+

## Install

```bash
git clone https://github.com/najino/Dastresa-Extension.git
cd Dastresa-Extension
npm install
```

## Development build

```bash
npm run dev
```

Load `dist/` as an unpacked extension in `chrome://extensions`.

## Production build

```bash
npm run build
```

Load the generated `dist/` folder the same way.

## Verify

```bash
npm run typecheck
npm run lint
npm test
```

## Persian / RTL

Set **Language → فارسی** in Options. Toolbar and settings honor `dir="rtl"`. TTS prefers Persian voices when available.
