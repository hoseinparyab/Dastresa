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

دسترسا یک افزونهٔ آفلاین کروم (Manifest V3) است که یک لایهٔ آرام دسترسی‌پذیری روی هر وب‌سایت اضافه می‌کند. برای سالمندان، افراد کم‌بینا و کسانی که سواد دیجیتال پایین‌تری دارند طراحی شده تا مستقل‌تر وب‌گردی کنند.

این محصول **اسکرین‌ریدر** نیست و **دستیار هوش مصنوعی** هم نیست. همه‌چیز روی دستگاه شما اجرا می‌شود. بدون ابر. بدون ردیابی. بدون API بیرونی.

> برند، متن استور و حریم خصوصی: [`docs/BRAND.md`](docs/BRAND.md) · [`docs/STORE_LISTING.md`](docs/STORE_LISTING.md) · [`docs/PRIVACY.md`](docs/PRIVACY.md)  
> مراحل انتشار: [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md)

## امکانات نسخهٔ MVP

| ماژول | کارش چیست |
|--------|-----------|
| تولبار دسترسی‌پذیری | شناور، قابل جابه‌جایی، دکمه‌های بزرگ |
| زوم هوشمند | اندازه متن و فاصلهٔ خواندن |
| تم‌ها | تاریک / روشن / کنتراست بالا (فقط با انتخاب شما) |
| حالت مطالعه | نمایش تمیزتر مقاله (Readability) |
| متن‌به‌گفتار | صدای مرورگر با هایلایت پاراگراف |
| فوکوس خواندن | کم‌کردن حواس‌پرتی، خط‌کش، کرسر واضح |
| تنظیمات | فارسی / انگلیسی · خاموش‌کردن برای یک سایت · ذخیره روی دستگاه |

**پیش‌فرض امن:** تا وقتی «فعال‌سازی» نزنید خاموش است · ظاهر عادی مرورگر · موقع نصب صفحه را بازنویسی نمی‌کند.

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

## دستورها

| دستور | کاربرد |
|-------|--------|
| `npm run dev` | ساخت زنده با Vite + CRX |
| `npm run build` | تایپ‌چک + بیلد نهایی |
| `npm run pack:mvp` | فشرده‌سازی `dist/` در `release/` برای آپلود استور |
| `npm run typecheck` | فقط TypeScript |
| `npm run lint` | ESLint |
| `npm test` | تست‌های Vitest |
| `npm run test:e2e` | تست دود Playwright |
| `npm run test:a11y` | تست‌های ثابت دسترسی‌پذیری |

## حریم خصوصی

- بدون آنالیتیکس و تلمتری
- بدون جمع‌آوری داده توسط سرور دسترسا (اصلاً سروری نیست)
- بدون درخواست شبکه از کد قابلیت‌های افزونه
- تنظیمات فقط روی دستگاه می‌ماند (`chrome.storage.local`)

متن کامل: [`docs/PRIVACY.md`](docs/PRIVACY.md)

## مستندات

| سند | موضوع |
|-----|--------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | معماری افزونه |
| [`docs/BRAND.md`](docs/BRAND.md) | بنیاد برند |
| [`docs/PRIVACY.md`](docs/PRIVACY.md) | سیاست حریم خصوصی |
| [`docs/STORE_LISTING.md`](docs/STORE_LISTING.md) | متن Chrome Web Store |
| [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md) | چک‌لیست انتشار |

## ناشر

ساخته شده توسط **[ناجینو](https://najino.com/)** — Digital Agency · [https://najino.com/](https://najino.com/)

## مجوز

[MIT](LICENSE) — Copyright (c) 2026 Najino Agency
