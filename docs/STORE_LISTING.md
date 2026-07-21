# Chrome Web Store — Listing Copy (MVP)

Use this copy as-is for the first public MVP. Keep screenshots aligned with brand (`docs/BRAND.md`).

## Listing fields

### Name

| Locale | Value | Notes |
|--------|-------|-------|
| EN | Dastresa | ≤45 chars |
| FA | دسترسا | Chrome shows locale by browser language |

### Short description (≤132 characters)

**EN:**  
`Offline accessibility for any website: larger text, clearer themes, read aloud, and a simple toolbar. Private. No AI cloud.`

**FA:**  
`دسترسی‌پذیری آفلاین برای هر سایت: متن بزرگ‌تر، تم واضح، خواندن با صدا و تولبار ساده. خصوصی. بدون ابر و هوش مصنوعی.`

### Detailed description (EN)

```
Dastresa makes websites easier to read and use — especially for older adults, low-vision users, and anyone who finds the modern web too small or too noisy.

WHAT YOU GET
• Floating accessibility toolbar with large touch targets
• Text size controls
• High-contrast and readable themes (only when you choose them)
• Reader mode for cleaner articles
• Read aloud with your browser’s voices (Persian voices preferred when available)
• Reading focus with optional ruler and high-visibility cursor
• Disable Dastresa on a single site, or exit completely

PRIVATE BY DESIGN
• Works offline in your browser
• No account
• No tracking
• No cloud AI
• Settings stay on your device

HOW TO START
1. Pin Dastresa
2. Open the popup and tap Enable
3. Use the on-page toolbar, or open full settings for more options

Dastresa is not a screen reader replacement. It is a calm accessibility layer you control.
```

### Detailed description (FA)

```
دسترسا وب‌سایت‌ها را خوانا و ساده‌تر می‌کند — به‌ویژه برای سالمندان، افراد کم‌بینا و کسانی که وب امروزی را شلوغ یا ریز می‌بینند.

چه چیزهایی دارید
• تولبار شناور با دکمه‌های بزرگ
• کنترل اندازه متن
• تم‌های خوانا و کنتراست بالا (فقط وقتی خودتان انتخاب کنید)
• حالت مطالعه برای مقاله تمیزتر
• خواندن با صدای مرورگر (ترجیح صدای فارسی در صورت موجود بودن)
• فوکوس خواندن با خط‌کش و کرسر واضح
• خاموش‌کردن فقط برای یک سایت، یا خروج کامل

حریم خصوصی
• آفلاین روی دستگاه شما
• بدون حساب کاربری
• بدون ردیابی
• بدون هوش مصنوعی ابری
• تنظیمات فقط روی دستگاه می‌ماند

شروع کار
۱. دسترسا را پین کنید
۲. از پاپ‌آپ «فعال‌سازی» را بزنید
۳. از تولبار روی صفحه یا تنظیمات کامل استفاده کنید

دسترسا جایگزین اسکرین‌ریدر نیست؛ یک لایه دسترسی‌پذیری آرام است که کنترلش با شماست.
```

## Category & metadata suggestions

- **Category:** Accessibility  
- **Language:** English + فارسی  
- **Single purpose:** Improve webpage readability and accessibility controls for the user  

## Permission justification (store form)

- **storage:** Save accessibility preferences locally  
- **Host access:** Inject the optional reading toolbar and styles on pages the user opens after enabling Dastresa  
- **activeTab:** Apply popup actions to the current tab  

## Assets checklist

| Asset | Spec | Location |
|-------|------|----------|
| Extension icon | 128×128 PNG | `public/icons/icon-128.png` + `docs/brand/store-icon-128.png` |
| Small promo (optional) | 440×280 | Create from brand mark before submit |
| Marquee (optional) | 1400×560 | Create before featured placement |
| Screenshots | 1280×800 or 640×400 | Capture: popup Enable, toolbar, reader, focus, options FA |

### Screenshot captions (EN)

1. Enable Dastresa when you need it — pages stay normal until you opt in  
2. One calm toolbar for read, speak, zoom, theme, and focus  
3. Reader mode strips clutter for long articles  
4. Reading focus + high-visibility cursor for following the line  
5. Full settings in Persian or English — everything stays on your device  

## Reviewer notes (paste in “Notes for reviewers”)

```
Dastresa is opt-in: after install it does not rewrite pages until the user clicks Enable in the popup.
Defaults use Normal (browser) appearance.
No remote code, no analytics endpoints, no accounts.
Privacy policy: [PASTE HOSTED URL]
Test path: Load any https page → open popup → Enable → use floating toolbar → Exit or “Disable on this site”.
```
