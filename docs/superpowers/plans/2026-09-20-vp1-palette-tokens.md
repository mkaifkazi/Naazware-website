# VP1 — Palette & Tokens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the shared multi-hue silk gradient ramp (`--silk-1/2/3`) as theme-aware CSS variables plus a Tailwind `silk` colour mapping, so later phases (SilkBackground, Accents) have colours to consume — without touching any primary UI control.

**Architecture:** Mirror the existing token pattern exactly: RGB-triplet CSS custom properties defined per theme in `styles/globals.css` (dark block + light block), surfaced through `tailwind.config.ts` `theme.extend.colors` with the `rgb(var(--x) / <alpha-value>)` form. A unit test on the Tailwind config locks the mapping in.

**Tech Stack:** Next.js 14, Tailwind CSS, CSS custom properties, Vitest.

## Global Constraints

- **Teal stays the brand accent.** Do NOT change `--accent*`, `.btn-accent`, links, or focus rings. The silk ramp is for backdrops/decorative accents only. (Spec §3)
- **RGB-triplet form** for every var (space-separated, no `rgb()` wrapper) so Tailwind's `<alpha-value>` works — identical to existing `--accent` etc. (existing pattern)
- **Both themes defined:** dark values in the `:root, [data-theme='dark']` block; light values in the `[data-theme='light']` block. Light values are deeper/de-saturated so low-opacity washes stay soft behind AA text. (Spec §3)
- **Shared hue identity (verbatim):** teal `#2DD4BF`, sky `#38BDF8`, violet `#8B5CF6` — dark theme uses these luminous; light theme uses the deeper variants below.
- **Gate after the task:** `npm run test` · `npm run type-check` · `npm run lint` · `npm run build` all green before commit.

---

### Task 1: Silk ramp CSS variables + Tailwind mapping

**Files:**
- Modify: `styles/globals.css` (dark block ~line 28–37 decorative area; light block ~line 62–70)
- Modify: `tailwind.config.ts:11-33` (colors)
- Create: `tailwind.config.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: CSS vars `--silk-1`, `--silk-2`, `--silk-3` (RGB triplets, both themes). Tailwind colours `silk.1`, `silk.2`, `silk.3` resolving to `rgb(var(--silk-N) / <alpha-value>)`. Later phases reference `bg-silk-1`, `rgb(var(--silk-2) / 0.2)`, etc.

- [ ] **Step 1: Write the failing test**

Create `tailwind.config.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import config from './tailwind.config'

describe('tailwind silk colour ramp', () => {
  it('exposes silk.1/2/3 wired to the CSS vars with alpha support', () => {
    const theme = config.theme as Record<string, any>
    const silk = theme.extend.colors.silk as Record<string, string>
    expect(silk['1']).toBe('rgb(var(--silk-1) / <alpha-value>)')
    expect(silk['2']).toBe('rgb(var(--silk-2) / <alpha-value>)')
    expect(silk['3']).toBe('rgb(var(--silk-3) / <alpha-value>)')
  })

  it('does not disturb the brand accent mapping', () => {
    const theme = config.theme as Record<string, any>
    expect(theme.extend.colors.accent.DEFAULT).toBe('rgb(var(--accent) / <alpha-value>)')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tailwind.config.test.ts`
Expected: FAIL — `Cannot read properties of undefined (reading '1')` (no `silk` key yet).

- [ ] **Step 3: Add the Tailwind mapping**

In `tailwind.config.ts`, add a `silk` block right after the `accent` block (inside `colors`):

```typescript
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)', // electric indigo
          hover: 'rgb(var(--accent-hover) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
          contrast: 'rgb(var(--accent-contrast) / <alpha-value>)',
        },
        // Silk ramp — backdrops + decorative accents ONLY (not UI controls).
        silk: {
          1: 'rgb(var(--silk-1) / <alpha-value>)', // teal
          2: 'rgb(var(--silk-2) / <alpha-value>)', // sky
          3: 'rgb(var(--silk-3) / <alpha-value>)', // violet
        },
```

- [ ] **Step 4: Add the dark-theme silk vars**

In `styles/globals.css`, inside the `:root, [data-theme='dark']` block's `/* Decorative */` group (after `--aura-strength: 0.14;`), add:

```css
    /* Silk gradient ramp — backdrops/accents only. Luminous on dark. */
    --silk-1: 45 212 191; /* teal  #2DD4BF */
    --silk-2: 56 189 248; /* sky   #38BDF8 */
    --silk-3: 139 92 246; /* violet #8B5CF6 */
```

- [ ] **Step 5: Add the light-theme silk vars**

In the `[data-theme='light']` block (after `--aura-strength: 0.5;`), add the deeper/de-saturated variants:

```css
    /* Silk gradient ramp — deeper for light so low-opacity washes stay soft. */
    --silk-1: 20 184 166; /* teal   #14B8A6 */
    --silk-2: 14 165 233; /* sky    #0EA5E9 */
    --silk-3: 124 58 237; /* violet #7C3AED */
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run test -- tailwind.config.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 7: Gate**

Run: `npm run type-check && npm run lint && npm run build`
Expected: PASS. (Build confirms Tailwind picks up the new colours without error.)

- [ ] **Step 8: Manual contrast sanity check (no code committed)**

Write a throwaway swatch file in the scratchpad only (NOT in the repo) that renders three stacked bands using `rgb(var(--silk-N) / 0.18)` behind `text-paper` and `text-paper-dim`, toggle `data-theme` light/dark, eyeball that body text stays clearly legible over each band in both themes. This is a smoke check for VP2's low-opacity backdrops — record the result in the commit body. Delete the swatch file after.

- [ ] **Step 9: Commit**

```bash
git add styles/globals.css tailwind.config.ts tailwind.config.test.ts
git commit -m "feat(theme): add silk gradient ramp tokens (--silk-1/2/3) + tailwind mapping (VP1)"
```

---

## Self-Review notes

- **Spec §3 coverage:** silk vars both themes ✔ · Tailwind mapping ✔ · teal accent untouched (asserted by test) ✔ · light deeper/desaturated ✔ · contrast smoke check ✔.
- **Type consistency:** var names `--silk-1/2/3` and Tailwind keys `silk.1/2/3` identical; RGB-triplet form matches existing tokens.
- **Out of scope (later phases):** no SilkBackground, no motion, no Accents, no page changes. VP1 is tokens only.
