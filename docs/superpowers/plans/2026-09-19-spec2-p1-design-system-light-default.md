# Spec 2 · Phase 1 — Design System + Light Default (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flip the public site's default theme to light, switch the display typeface to a modern serif, and refine the light-first token/primitive layer — without breaking the existing dark toggle or the green gate.

**Architecture:** The site already has a per-theme CSS-variable token system (`ink`/`paper`/`accent` in `styles/globals.css`, mapped in `tailwind.config.ts`) and a no-flash inline theme script in `app/layout.tsx` plus a client `ThemeToggle`. P1 changes the *default* resolution (absent a stored choice → light, not system/dark), replaces `Space_Grotesk` with `Fraunces` via `next/font/google`, and polishes light-mode token values + a few primitives. Legacy visuals keep working; later phases build motion/pages on top.

**Tech Stack:** Next 14 App Router, TypeScript, Tailwind, `next/font/google`, Vitest + jsdom.

## Global Constraints

- Gate must stay GREEN every task: `npm run test` (currently 60) · `npm run type-check` · `npm run lint` · `npm run build`.
- Dark theme + toggle must keep working; only the *default* (no stored preference) changes to light.
- Body font stays **Inter**. Display font becomes **Fraunces** (serif). Mono stays JetBrains Mono.
- Accent stays **teal only** (`#2DD4BF` fill, `#0F766E` text on light). No second accent.
- No new routes, no content changes. Existing token variable names (`--ink-*`, `--paper*`, `--accent*`, `--font-display`) must not be renamed (consumed across the codebase).
- Commit after every task. Branch: `feat/custom-cms`.

---

### Task 1: Default theme resolves to light

**Files:**
- Create: `lib/theme.ts`
- Test: `lib/__tests__/theme.test.ts`
- Modify: `app/layout.tsx` (inline no-flash script + `<meta name="theme-color">` default)
- Modify: `components/ThemeToggle.tsx:24` (theme-color meta update values)

**Interfaces:**
- Consumes: nothing.
- Produces: `resolveInitialTheme(stored: string | null): 'light' | 'dark'` — returns `stored` when it is exactly `'light'` or `'dark'`, otherwise `'light'`. `THEME_COLORS: { light: string; dark: string }` — the `theme-color` meta values (`light: '#fafaf7'`, `dark: '#0b0b0c'`).

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/theme.test.ts
import { describe, it, expect } from 'vitest'
import { resolveInitialTheme, THEME_COLORS } from '@/lib/theme'

describe('resolveInitialTheme', () => {
  it('honors a stored light choice', () => {
    expect(resolveInitialTheme('light')).toBe('light')
  })
  it('honors a stored dark choice', () => {
    expect(resolveInitialTheme('dark')).toBe('dark')
  })
  it('defaults to light when nothing is stored', () => {
    expect(resolveInitialTheme(null)).toBe('light')
  })
  it('defaults to light for any invalid stored value', () => {
    expect(resolveInitialTheme('purple')).toBe('light')
  })
})

describe('THEME_COLORS', () => {
  it('exposes light-first defaults', () => {
    expect(THEME_COLORS.light).toBe('#fafaf7')
    expect(THEME_COLORS.dark).toBe('#0b0b0c')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lib/__tests__/theme.test.ts`
Expected: FAIL — cannot resolve `@/lib/theme`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/theme.ts
export type Theme = 'light' | 'dark'

export const THEME_COLORS: Record<Theme, string> = {
  light: '#fafaf7',
  dark: '#0b0b0c',
}

/**
 * Resolve the theme to apply before first paint.
 * Stored choice wins; absent/invalid → light (light-first default).
 * Note: system preference is intentionally NOT auto-followed — light is the
 * brand default and dark is an explicit opt-in via the toggle.
 */
export function resolveInitialTheme(stored: string | null): Theme {
  return stored === 'light' || stored === 'dark' ? stored : 'light'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- lib/__tests__/theme.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Update the inline no-flash script + meta default in `app/layout.tsx`**

Replace the existing inline `<script dangerouslySetInnerHTML>` theme block with light-first logic (mirrors `resolveInitialTheme`; kept as a literal string because it runs before hydration):

```tsx
{/* Set theme before paint. Mirrors lib/theme.ts resolveInitialTheme:
    stored choice wins; otherwise light (light-first default). */}
<script
  dangerouslySetInnerHTML={{
    __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t='light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
  }}
/>
```

Change the static meta default from dark to light:

```tsx
<meta name="theme-color" content="#fafaf7" />
```

- [ ] **Step 6: Align `ThemeToggle` meta values with `THEME_COLORS`**

In `components/ThemeToggle.tsx`, import the shared constant and use it (replaces the hardcoded `'#0a0a0b'`/`'#ffffff'`):

```tsx
import { THEME_COLORS } from '@/lib/theme'
// ...inside toggle(), replacing the meta.setAttribute line:
if (meta) meta.setAttribute('content', THEME_COLORS[next])
```

Also change the mount fallback default in the `useEffect` from `'dark'` to `'light'`:

```tsx
const current = (document.documentElement.getAttribute('data-theme') as Theme) || 'light'
```

- [ ] **Step 7: Verify gate + default behavior**

Run: `npm run test && npm run type-check && npm run lint`
Expected: all pass (test count = prior + 5).
Run: `npm run build`
Expected: builds clean.
Manual: `npm run dev`, open in a fresh/incognito window (no `theme` in localStorage) → site loads in **light**; toggle → dark persists on reload; toggle back → light.

- [ ] **Step 8: Commit**

```bash
git add lib/theme.ts lib/__tests__/theme.test.ts app/layout.tsx components/ThemeToggle.tsx
git commit -m "feat(theme): default public site to light-first (Spec 2 P1)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Serif display typeface (Fraunces)

**Files:**
- Modify: `app/layout.tsx` (swap `Space_Grotesk` → `Fraunces` from `next/font/google`)
- Modify: `tailwind.config.ts:` (`fontFamily.display` fallback stack)
- Test: `lib/__tests__/theme.test.ts` (no change) — this task is verified by build + type-check + visual.

**Interfaces:**
- Consumes: nothing.
- Produces: `--font-display` now bound to Fraunces (variable name unchanged; all `font-display` consumers pick it up automatically).

- [ ] **Step 1: Swap the font import in `app/layout.tsx`**

Replace the `Space_Grotesk` import and initializer:

```tsx
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})
```

Update the `<html className>` to use `fraunces.variable` in place of `spaceGrotesk.variable`:

```tsx
className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
```

- [ ] **Step 2: Update the Tailwind display fallback stack**

In `tailwind.config.ts`, change the `display` family fallback from Space Grotesk to a serif stack:

```ts
display: ['var(--font-display)', 'Fraunces', 'Georgia', 'serif'],
```

- [ ] **Step 3: Verify gate**

Run: `npm run type-check && npm run lint && npm run test`
Expected: all pass.
Run: `npm run build`
Expected: builds clean; Fraunces fetched by `next/font` at build.

- [ ] **Step 4: Visual check**

Manual: `npm run dev` → headings (`font-display`) render in serif in both light and dark; body remains Inter. Check the fluid `display-*` sizes still look right (tracking is tight for a grotesk — note any heading that needs per-face tracking tuning for Task 3).

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx tailwind.config.ts
git commit -m "feat(type): switch display face to Fraunces serif (Spec 2 P1)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Light-first token + display-tracking polish

**Files:**
- Modify: `tailwind.config.ts` (`fontSize.display-*` letterSpacing for serif)
- Modify: `styles/globals.css` (light-theme token nudges if the visual pass flags any)
- Test: none new — verified by gate + visual review.

**Interfaces:**
- Consumes: `--font-display` = Fraunces (Task 2), light default (Task 1).
- Produces: final P1 light-first look; later phases assume these tokens/tracking.

- [ ] **Step 1: Relax display tracking for the serif**

Fraunces needs less negative tracking than the grotesk. In `tailwind.config.ts`, soften `letterSpacing` on the fluid display sizes (grotesk used ~`-0.045em`; serif reads better nearer `-0.02em`):

```ts
'display-xl': ['clamp(3.25rem, 10vw, 9rem)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
'display-lg': ['clamp(2.75rem, 7.5vw, 6.5rem)', { lineHeight: '0.98', letterSpacing: '-0.018em' }],
'display-md': ['clamp(2rem, 4.5vw, 3.75rem)', { lineHeight: '1.02', letterSpacing: '-0.015em' }],
'display-sm': ['clamp(1.6rem, 3vw, 2.25rem)', { lineHeight: '1.12', letterSpacing: '-0.01em' }],
```

- [ ] **Step 2: Light-mode visual audit (default theme)**

Manual: `npm run dev` in light mode, walk every public page (`/`, `/work`, `/work/[slug]`, `/services`, `/services/[slug]`, `/about`, `/blog`, `/contact`, `/privacy`, `/terms`). For each, confirm: text contrast reads AA, borders/hairlines visible on `#FAFAF7`, cards (`#FFFFFF`) separate from base, accent teal legible (use deep-teal `--accent-soft` `#0F766E` for accent *text*). Record any token nudge needed.

- [ ] **Step 3: Apply any token nudges (only if the audit flagged something)**

If the audit found a weak value, adjust the corresponding light-theme var in `styles/globals.css` (e.g. bump `--ink-600` border contrast or `--paper-faint`). Keep changes minimal and within the existing variable set — do not rename variables. If the audit found nothing, skip this step and note "no nudges needed" in the commit body.

- [ ] **Step 4: Verify gate**

Run: `npm run test && npm run type-check && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts styles/globals.css
git commit -m "style(theme): light-first token + serif display tracking polish (Spec 2 P1)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage (Section 3 + Section 6 P1):**
- Default flips to light → Task 1. ✓
- Dark toggle stays → Task 1 (toggle + persistence preserved). ✓
- Serif display via `next/font`, body stays Inter → Task 2. ✓
- Teal-only, no rename of tokens → Global Constraints + Task 3. ✓
- Refine tokens / restyle primitives (light-first) → Task 3. ✓
- Gate green each phase → every task Step ends with the gate. ✓

**Deferred to later phases (correctly out of P1 scope):** Lenis/cursor/GSAP/Framer (P2), home rebuild + copy (P3), WebGL (P4), contact call-option (P5), remaining pages (P6), perf/a11y gates (P7).

**Placeholder scan:** Task 3 Step 3 is conditional ("only if audit flagged") — this is a legitimate audit-then-fix step, not a placeholder; it names the exact files/vars and the skip-and-note fallback. No TBDs.

**Type consistency:** `resolveInitialTheme`, `THEME_COLORS`, `Theme` used consistently across `lib/theme.ts`, its test, and `ThemeToggle`. `--font-display` variable name unchanged so no consumer breaks.
