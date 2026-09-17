# دسترسا — مشخصات فنی ویژگی‌ها (تا 1.2.0 Understand)

**نسخه سند:** هم‌تراز با افزونه `1.2.0`  
**محصول:** افزونه Chrome Manifest V3 (آفلاین‌محور + خلاصه اختیاری)  
**ناشر:** Najino Group

این سند خلاصهٔ فنی چیزهایی است که تا الان پیاده شده‌اند؛ برای تیم فنی، بازبینی و آماده‌سازی انتشار.

---

## ۱. معماری کلی

| لایه | نقش |
|------|-----|
| Content script | تزریق لایه دسترسی‌پذیری روی صفحات `http/https` |
| Background (service worker) | پیام‌رسانی، خلاصه صفحه، باز کردن options/onboarding |
| Popup / Options / Onboarding | UI افزونه (React) |
| Feature plugins | هر قابلیت یک `IFeature` با `initialize / enable / disable / dispose` |
| Event bus | ارتباط داخلی بدون coupling مستقیم |
| Semantics (`src/core/semantics`) | مدل ساختاری صفحه، نوع صفحه، فرم‌ها (محلی) |
| Storage | فقط `chrome.storage.local` (تنظیمات + secrets جدا) |

**قرارداد فعال‌سازی:** تا `extensionActive === true` نباشد، صفحه دست‌نخورده می‌ماند. خاموش‌کردن per-site با `disabledSites` و `sitePreferences.enabled=false` ممکن است.

**مسیرهای کلیدی کد:**

- بوت محتوا: `src/content/`
- رجیستری قابلیت‌ها: `src/features/*`
- تنظیمات: `src/core/settings/` (schema v2، migrate، profiles، site-key)
- معناشناسی: `src/core/semantics/`
- ثابت‌ها و رویدادها: `src/core/constants/index.ts`

---

## ۲. ماتریس ویژگی‌ها

| ID | نام | محل اجرا | شبکه؟ | وضعیت |
|----|-----|----------|-------|--------|
| `toolbar` | تولبار شناور | صفحه (Shadow DOM) | خیر | آماده |
| `themes` | تم‌های رنگی / کنتراست | صفحه (CSS + scrub محدود) | خیر | آماده |
| `smart-zoom` | زوم متن و فاصله خواندن | صفحه | خیر | آماده |
| `reader-mode` | مطالعه ۲.۰ (TOC / پیشرفت / ناوبری) | صفحه (overlay) | خیر | آماده |
| `text-to-speech` | خواندن متن | صفحه | خیر | آماده |
| `reading-focus` | فوکوس خواندن + نشانگر | صفحه | خیر | آماده |
| `dom-analyzer` | تحلیل معنایی + نوع صفحه + فرم | صفحه | خیر | آماده (1.2.0) |
| `page-summary` | خلاصه صفحه | background | اختیاری | آماده |
| profiles | پروفایل دسترسی‌پذیری | تنظیمات | خیر | آماده (1.2.0) |
| site-prefs | ترجیحات per-site | storage | خیر | آماده (1.2.0) |
| `settings` / `storage` | تنظیمات و ذخیره | همه سطوح | خیر | آماده |
| onboarding | تور اولیه | صفحه جدا | خیر | آماده |

---

## ۳. جزئیات فنی هر ویژگی

### ۳.۱ تولبار دسترسی‌پذیری (`toolbar`)

- UI شناور، قابل کشیدن، جمع/باز شدن.
- دستورات اصلی: Reader، Speak، Zoom ±، Theme، Focus، Summary، Pause/Resume/Stop، Settings، Reset، Exit.
- موقعیت در `toolbarPosition` ذخیره می‌شود.
- ایزوله با Shadow DOM تا استایل سایت نشکند.

### ۳.۲ تم‌ها (`themes`)

- شناسه‌ها: `normal` | `dark` | `light` | `high-contrast` | `black-white` | `yellow-black`
- پیش‌فرض: `normal` (بدون CSS اجباری).
- تم‌های رنگی: رنگ‌آمیزی سطح‌ها + کنترل‌ها؛ برای گوگل: خنثی‌سازی هاله/گرادیان و پوستهٔ سرچ‌بار با تشخیص درست «pill» کامل (متن + آیکون‌ها).
- scrub محدود DOM (بدون اسکن کل صفحه که باعث کرش می‌شد).
- گزینه‌ها: `largeCursor`، `largeButtons`.
- از `resolveEffectiveSettings` برای overrideهای per-site استفاده می‌کند.

### ۳.۳ زوم هوشمند (`smart-zoom`)

پارامترها (باید در بازه schema باشند):

| کلید | بازه تقریبی | پیش‌فرض |
|------|-------------|----------|
| `textScale` | 0.8–2.5 | 1 |
| `lineHeight` | 1.2–2.4 | 1.2 |
| `letterSpacing` | 0–0.2 em | 0 |
| `wordSpacing` | 0–0.5 em | 0 |
| `contentWidth` / `maxLineLength` | 40–100 ch | 100 |

اعمال روی عناصر متنی شناسایی‌شده؛ در حالت پیش‌فرض امن، ریست می‌شود. Override per-site از `sitePreferences` ممکن است.

### ۳.۴ حالت مطالعه ۲.۰ (`reader-mode`)

- استخراج محتوا با `@mozilla/readability` + fallback + درخت heading معنایی.
- TOC، ناوبری بخش قبلی/بعدی، نوار پیشرفت خواندن.
- overlay تمام‌صفحه با برچسب‌های FA/EN.
- رویدادها: `reader:activated` / `reader:content-ready` / `reader:structure-ready` / `reader:deactivated`.

### ۳.۵ متن‌به‌گفتار (`text-to-speech`)

- موتور: `speechSynthesis` مرورگر.
- تنظیمات: rate / pitch / volume / voiceURI / preferPersian.
- هایلایت پاراگراف فعال (`data-Dastresa-speech`).
- کنترل از تولبار: read / pause / resume / stop.

### ۳.۶ فوکوس خواندن (`reading-focus`)

- کم‌کردن opacity پاراگراف‌های غیرجاری.
- کرسر رنگی قابل انتخاب: sky / yellow / lime / magenta / white.
- خط‌کش افقی اختیاری (`readingRuler`).
- ناوبری کیبورد (مثلاً Arrow / j-k) و انتخاب با کلیک روی پاراگراف.
- کرسر بالای dialog/modal (popover / لایه بالا).

### ۳.۷ تحلیل معنایی و فرم (`dom-analyzer` / semantics)

- `PageStructure`: landmarks، headings tree، articles، links، buttons، forms، inputs.
- تشخیص نوع صفحه بدون LLM (confidence + signals).
- Form Analyzer: برچسب‌گذاری (`for`/`id`/wrapping/`aria-*`)، required، validation — فقط توصیف، بدون پر کردن.
- رویدادها: `page:analyzed`، `page:type-detected`، `form:analyzed`.
- MutationObserver با debounce؛ بدون `querySelectorAll('*')`.

### ۳.۸ پروفایل‌ها و ترجیحات سایت

- پروفایل‌ها: `normal` | `low-vision` | `elderly` | `reading` | `high-contrast` | `custom`.
- فقط preset روی تنظیمات موجود؛ کاربر می‌تواند بعداً سفارشی کند.
- `sitePreferences`: overrideهای جزئی + سازگاری با `disabledSites`.
- `normalizeSiteKey`: hostname lowercase، حذف `www.`، نگه‌داشتن port غیرپیش‌فرض.
- مهاجرت: `SETTINGS_SCHEMA_VERSION = 2` از طریق `migrateSettings`.

### ۳.۹ خلاصه صفحه (`page-summary`)

| حالت | رفتار |
|------|--------|
| `free` | `POST` به API دسترسا (`docs.json` → `https://api.dastresa.najino.com`) با سهمیه روزانه |
| `luma` | کلید کاربر در `chrome.storage.local` (secrets) — بدون سهمیه رایگان |
| `gemini` | مشابه، API جمینای |

- متن فقط با زدن Summary ارسال می‌شود.
- کلیدها در `STORAGE_KEYS.SECRETS` می‌مانند و به صفحه تزریق نمی‌شوند.
- overlay نتیجه / خطا / کپی متن.

### ۳.۸ تنظیمات و چرخه عمر

- Schema با Zod: `DastresaSettingsSchema`.
- پارس مقاوم: فیلد خراب فقط همان فیلد را به پیش‌فرض برمی‌گرداند.
- `Reset`: ظاهر صفحه را تمیز می‌کند؛ locale/speech/لیست سایت‌ها حفظ می‌شود.
- `Exit`: `extensionActive = false` و خاموشی قابلیت‌ها.
- پیام‌های runtime: activate / exit / reset / apply-settings / summarize.

### ۳.۹ i18n و UI

- زبان‌ها: `fa` (پیش‌فرض) و `en`؛ `dir` هماهنگ (rtl/ltr).
- `_locales` برای نام افزونه؛ رشته‌های محصول در `src/shared/i18n`.
- سطوح UI: Popup، Options، Onboarding، Toolbar.

### ۳.۱۰ Onboarding

- تور کوتاه پس از نصب (`ONBOARDING_VERSION`).
- باز شدن از background در صورت نیاز.

---

## ۴. مدل داده تنظیمات (خلاصه)

```
extensionActive, disabledSites[]
theme, largeCursor, largeButtons
readerMode, readingFocus, readingRuler, focusCursorColor
zoom { textScale, lineHeight, letterSpacing, wordSpacing, contentWidth, maxLineLength, imageScale }
speech { rate, pitch, volume, voiceURI, preferPersian }
toolbarPosition { x, y }
locale, dir
summaryProvider, summaryModel
```

Secrets (جدا): کلیدهای Luma / Gemini.

---

## ۵. رویدادهای داخلی مهم

| رویداد | کاربرد |
|--------|--------|
| `settings:changed` | همگام‌سازی همه فیچرها |
| `toolbar:command` | اجرای اکشن از تولبار |
| `theme:applied` / `zoom:applied` | بازخورد اعمال |
| `speech:*` / `focus:paragraph` | همگام TTS و فوکوس |
| `summary:*` | وضعیت خلاصه |
| `extension:activated` / `extension:exited` | وضعیت سراسری |

---

## ۶. امنیت و حریم خصوصی (MVP)

- بدون آنالیتیکس / بدون ردیابی.
- CSP صفحات افزونه محدود به `'self'`.
- مجوزها: `storage`، `activeTab`، host برای تزریق محتوا.
- خلاصه: opt-in لحظه‌ای؛ کلید کاربر محلی.
- سیاست رسمی: `docs/PRIVACY.md`.

---

## ۷. بیلد و انتشار

| مورد | مقدار |
|------|--------|
| نسخه فعلی | `1.1.1` |
| بیلد | Vite + `@crxjs/vite-plugin` |
| خروجی | `dist/` |
| پکیج استور | `npm run pack:mvp` → `release/dastresa-mvp-<version>.zip` |
| چک‌لیست | `docs/RELEASE_CHECKLIST.md` |

---

## ۸. خارج از محدودهٔ این MVP (عمداً)

- اسکرین‌ریدر کامل / پشتیبانی AT پیچیده
- همگام‌سازی ابری تنظیمات (`storage.sync`)
- اعمال روی iframeها (`all_frames: false`)
- آنالیتیکس محصول
- تم اختصاصی per-site پیشرفته فراتر از disable

---

## ۹. ارجاع سریع به پوشه‌ها

| موضوع | مسیر |
|--------|------|
| معماری | `docs/ARCHITECTURE.md` |
| Manifest | `docs/MANIFEST.md` |
| خلاصه | `src/features/page-summary/README.md` |
| API خلاصه | `docs.json` + پروژه جدا `Dastresa-API-Core` / Summary API |
| برند / استور | `docs/BRAND.md`, `docs/STORE_LISTING.md` |

---

*این فایل وضعیت پیاده‌سازی فعلی را توصیف می‌کند؛ با تغییر نسخه، بخش‌های «نسخه» و ماتریس ویژگی را به‌روز کنید.*
