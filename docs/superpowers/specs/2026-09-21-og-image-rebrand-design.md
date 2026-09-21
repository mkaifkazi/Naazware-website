# OG Image Rebrand — Design

**Date:** 2026-09-21
**Status:** Approved (approach A)

## Goal

Update the social share image (`public/og-image.png`) to match the current site
branding, and align `manifest.json` copy. The existing OG image uses an old sans
grotesk headline, the old tagline, and an old capability row — none of which match
the live site.

## Brand source (pulled from live site)

| Token | Value | Source |
|-------|-------|--------|
| Display font | Fraunces (serif) | `app/layout.tsx` |
| Body/mono | Inter / JetBrains Mono | `app/layout.tsx` |
| Background | `#0B0B0C` (dark) | `styles/globals.css` |
| Accent | `#2DD4BF` teal | `styles/globals.css` |
| Silk ramp | `#2DD4BF` → `#38BDF8` → `#8B5CF6` | `styles/globals.css` |
| Headline | "Custom software, crafted to fit." | `lib/home-content.ts` |
| Eyebrow | "Custom software studio" | `lib/home-content.ts` |
| Capabilities | Websites · Web & mobile apps · Branding · Care & hosting | `lib/home-content.ts` |
| URL | naazware.com | `lib/site.ts` |

## OG image design (1200×630)

- Dark base `#0B0B0C` + faint grid (matches site hero). Social previews read best on
  dark; dark remains the signature brand surface.
- Top-left: logo mark (white tile + teal arrow, from `favicon.svg`) + "Naazware"
  wordmark (Inter, semibold, white).
- Center-left headline in **Fraunces**: "Custom software," in white / "crafted to fit."
  in teal.
- Bottom-left: capability row in JetBrains Mono, dim — Websites · Web & mobile apps ·
  Branding · Care & hosting.
- Bottom-right: `naazware.com` in mono, teal.
- Soft silk radial glow (teal→violet) top-right corner.

## manifest.json

- Update `description` → "A custom software studio crafting websites, web, and mobile apps."
- Keep name, short_name, colors, icons unchanged.

## Production method (approach A)

No headless-render tooling installed. Keep `public/og-image.png` a **static file** so
the many hardcoded `/og-image.png` references in `lib/seo.ts` (org schema, article
schema fallback, twitter/OG defaults) stay valid.

1. `scripts/og/og-template.html` — self-contained 1200×630 template. Fraunces + JetBrains
   Mono loaded from Google Fonts at render time; inline logo mark.
2. `scripts/og/render-og.mjs` — `puppeteer-core` driving installed Edge
   (`msedge.exe`), viewport 1200×630, waits `document.fonts.ready`, screenshots to
   `public/og-image.png`.
3. `puppeteer-core` added as devDependency; no bundled Chromium download (reuses Edge).
4. Script committed so the OG can be re-rendered after future copy/brand changes.

## Out of scope

- Per-page dynamic OG (approach B, `app/opengraph-image.tsx`).
- Logo, favicon, icon PNGs (unchanged).
