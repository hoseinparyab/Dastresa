# Brand assets

| File | Use |
|------|-----|
| `icon-master.png` | Dastresa source mark (navy + cyan) |
| `store-icon-128.png` | Chrome Web Store icon + README |
| `store-icon-440.png` | Base for optional small promo tile |
| `najino-logo.png` | Official Najino raster source |
| `najino-logo.svg` | Full Najino Group logo (README / docs) |
| `najino-mark.svg` | Bird mark only (extension publisher credit) |

Rebuild SVGs from the PNG:

```bash
python scripts/build-najino-svg.py
```

Extension runtime icons: `public/icons/icon-{16,32,48,128}.png`  
Publisher assets in the package: `public/brand/najino-*.svg`

Publisher: [Najino Group](https://najino.com/)

See `docs/BRAND.md` for color, voice, and non-promises.
