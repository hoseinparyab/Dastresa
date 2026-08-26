# دسترسا (Dastresa)

**[English](README.md)** · **[فارسی](README.fa.md)**

<p align="center">
  <img src="docs/brand/store-icon-128.png" alt="لوگوی دسترسا" width="96" height="96" />
  &nbsp;&nbsp;&nbsp;
  <img src="docs/brand/najino-logo.svg" alt="Najino Group — Digital Agency" height="96" />
</p>

<p align="center">
  <strong>دسترسا</strong> ساخته‌شده توسط <a href="https://najino.com/">ناجینو</a>
</p>

**هر وب‌سایتی را خوانا و ساده‌تر کنید.**

دسترسا یک افزونهٔ **آفلاین‌محور** کروم (Manifest V3) است که یک لایهٔ آرام دسترسی‌پذیری روی هر وب‌سایت اضافه می‌کند. برای سالمندان، افراد کم‌بینا و کسانی که سواد دیجیتال پایین‌تری دارند طراحی شده تا مستقل‌تر وب‌گردی کنند.

این محصول **اسکرین‌ریدر** نیست. ابزارهای اصلی خواندن (تم، زوم، مطالعه، گفتار، فوکوس، تولبار) **روی دستگاه** اجرا می‌شوند — بدون ردیابی و آنالیتیکس.

**اختیاری:** خلاصهٔ صفحه فقط وقتی دکمهٔ خلاصه را بزنید، از بک‌اند دسترسا (یا کلید لومای خودتان) استفاده می‌کند.

> برند، متن استور و حریم خصوصی: [`docs/BRAND.md`](docs/BRAND.md) · [`docs/STORE_LISTING.md`](docs/STORE_LISTING.md) · [`docs/PRIVACY.md`](docs/PRIVACY.md)  
> مراحل انتشار: [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md)

**نسخهٔ فعلی:** `1.0.0`

## امکانات نسخهٔ MVP

| ماژول | کارش چیست |
|--------|-----------|
| تولبار دسترسی‌پذیری | شناور، قابل جابه‌جایی، دکمه‌های بزرگ |
| زوم هوشمند | اندازه متن و فاصلهٔ خواندن |
| تم‌ها | تاریک / روشن / کنتراست بالا (فقط با انتخاب شما) |
| حالت مطالعه | نمایش تمیزتر مقاله (Readability) |
| متن‌به‌گفتار | صدای مرورگر با هایلایت پاراگراف |
| فوکوس خواندن | کم‌کردن حواس‌پرتی، خط‌کش، کرسر واضح |
| خلاصه صفحه | خلاصه با یک دکمه (سهمیه رایگان روزانه یا کلید اختیاری لوما) |
| تنظیمات | فارسی / انگلیسی · خاموش‌کردن برای یک سایت · ذخیره روی دستگاه |
| آشنایی اولیه | تور کوتاه بعد از نصب |

**پیش‌فرض امن:** تا وقتی «فعال‌سازی» نزنید خاموش است · ظاهر عادی مرورگر · موقع نصب صفحه را بازنویسی نمی‌کند.

### خلاصه صفحه (اختیاری / با درخواست شما)

| حالت | رفتار |
|------|--------|
| **رایگان (پیش‌فرض)** | API خلاصه دسترسا (~**۵ خلاصه / IP / روز**) |
| **کلید لومای خودتان** | در تنظیمات · مستقیم به لوما · محدودیت رایگان اعمال نمی‌شود |

- متن صفحه **فقط** با زدن خلاصه فرستاده می‌شود.
- کلید رایگان روی سرور می‌ماند (`server/` — Cloudflare Worker)، نه داخل پکیج افزونه.
- جزئیات: [`src/features/page-summary/README.md`](src/features/page-summary/README.md) · [`server/README.md`](server/README.md)

## شروع سریع

```bash
npm install
npm run build
```

سپس در کروم:

1. بروید به `chrome://extensions`
2. **Developer mode** را روشن کنید
3. **Load unpacked** را بزنید و پوشهٔ `dist/` را انتخاب کنید
4. پاپ‌آپ را باز کنید → **فعال‌سازی دسترسا**
5. از تولبار روی صفحه استفاده کنید

حالت توسعه (watch):

```bash
npm run dev
```

### بک‌اند محلی برای خلاصه رایگان

```bash
npm run server:install
# کلید را در server/.dev.vars بگذارید (نمونه: server/.dev.vars.example)
npm run server:dev
```

آدرس پیش‌فرض: `http://127.0.0.1:8787` (ثابت `SUMMARY_API.BASE_URL` در `src/core/constants/index.ts`).

بعد از دیپلوی، همان ثابت را به URL ورکر خودتان تغییر دهید.

## دستورها

| دستور | کاربرد |
|-------|--------|
| `npm run dev` | ساخت زنده با Vite + CRX |
| `npm run build` | تایپ‌چک + بیلد نهایی |
| `npm run pack:mvp` | فشرده‌سازی `dist/` در `release/` برای آپلود استور |
| `npm run server:install` | نصب وابستگی‌های ورکر |
| `npm run server:dev` | اجرای محلی API خلاصه (Wrangler) |
| `npm run server:deploy` | دیپلوی ورکر خلاصه |
| `npm run typecheck` | فقط TypeScript |
| `npm run lint` | ESLint |
| `npm test` | تست‌های Vitest |
| `npm run test:e2e` | تست دود Playwright |
| `npm run test:a11y` | تست‌های ثابت دسترسی‌پذیری |

## حریم خصوصی

- بدون آنالیتیکس و تلمتری
- تنظیمات و کلید اختیاری فقط روی دستگاه (`chrome.storage.local`)
- ابزارهای دسترسی‌پذیری به شبکه نیاز ندارند
- **فقط خلاصه صفحه:** با زدن خلاصه، متن به بک‌اند رایگان دسترسا **یا** (در صورت تنظیم) لوما با کلید شما می‌رود
- سهمیه رایگان محدود است؛ کلید لوما برای استفاده بیشتر اختیاری است

متن کامل: [`docs/PRIVACY.md`](docs/PRIVACY.md) *(قبل از انتشار عمومی خلاصه، متن حریم خصوصی استور را هم به‌روز کنید)*

## نکات معماری

- ساختار feature-plugin در `src/features/` با ports/adapters ([`docs/adr/001-feature-plugin-ports.md`](docs/adr/001-feature-plugin-ports.md))
- اسکیمای تنظیمات: `src/core/settings/`
- پروکسی خلاصه: `server/` (Cloudflare Worker)

## مستندات

| سند | موضوع |
|-----|--------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | معماری افزونه |
| [`docs/SETUP.md`](docs/SETUP.md) | راه‌اندازی محیط |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | روند توسعه |
| [`docs/BRAND.md`](docs/BRAND.md) | بنیاد برند |
| [`docs/PRIVACY.md`](docs/PRIVACY.md) | سیاست حریم خصوصی |
| [`docs/STORE_LISTING.md`](docs/STORE_LISTING.md) | متن Chrome Web Store |
| [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md) | چک‌لیست انتشار |
| [`server/README.md`](server/README.md) | ورکر API خلاصه |
| [`src/features/page-summary/README.md`](src/features/page-summary/README.md) | قابلیت خلاصه صفحه |

## ناشر

ساخته شده توسط **[ناجینو](https://najino.com/)** — Digital Agency · [https://najino.com/](https://najino.com/)

## مجوز

[MIT](LICENSE) — Copyright (c) 2026 Najino Agency
