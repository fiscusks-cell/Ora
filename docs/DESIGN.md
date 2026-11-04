# ORA — Style Reference

> Aurora through a midnight observatory — the hero is a vertical beam of violet melting into coral, and every quiet section below it borrows that same two-color story told at lower volume.

**Theme:** mixed — a dark graphite canvas for the product, light bands for editorial sections, and a user-controlled light/dark toggle inside the app.

This document describes the design system **as implemented in this repository**. Anything listed as *pending* below is not yet in the code. Derived from the Huly style extraction (June 2026); the ORA-specific decisions are in *Implementation notes*.

## Status

| Surface | Tokens applied | Notes |
|---|---|---|
| `app/globals.css` — tokens, theme aliases | **done** | `@theme static` tokens; 27 legacy aliases resolve to them in both modes |
| `app/layout.tsx` — fonts | **done** | Inter via `next/font`; Sora loaded as the display face |
| Landing (`/`, `/pricing`) | pending | hardcoded slate/yellow palette today |
| Sign-in, sign-up, forgot/reset password, invite | pending | hardcoded palette; the auth video scrim still carries two colors from the previous (never implemented) spec — fix with this step |
| Dashboard: timer, reports, projects, clients, periods, invoices, settings, home | pending | reads the aliases; Reports is hardcoded `slate-*` and ignores the theme |
| `components/reports/ReportPDF.tsx` | **out of scope** | a printable business document with its own react-pdf stylesheet; decided separately, tokens must not leak in |

## Tokens — Colors

| Name | Value | Token / utility | Role |
|------|-------|-------|------|
| Obsidian Canvas | `#303236` | `--color-obsidian-canvas` · `bg-obsidian-canvas` | Dark page background — near-black with a whisper of warmth, the default stage for product screens |
| Void | `#090a0c` | `--color-void` | Deepest surface: hero gradient base, modal backdrops, borders that should vanish into the canvas; also primary text on light |
| Charcoal Card | `#111111` | `--color-charcoal-card` | Card and panel surfaces on the dark canvas (elevation is *darker*, not lighter) |
| Slate Edge | `#4a4b50` | `--color-slate-edge` | Hairline borders and dividers on dark |
| Iron Veil | `#6b6c6d` | `--color-iron-veil` | Muted fills, disabled washes; muted text on dark, secondary text on light |
| Smoke | `#95979e` | `--color-smoke` | Secondary text and icon strokes on dark; muted text on light — the workhorse mid-gray |
| Ash | `#a9a9aa` | `--color-ash` | Tertiary text in content-heavy lists |
| Frost | `#d1d1d1` | `--color-frost` | Borders, inputs and secondary CTA outlines on light |
| Linen | `#e5e5e7` | `--color-linen` | Light surface tint, dividers, raised/hover surfaces on light |
| Snow | `#ffffff` | `--color-snow` | Light card surface; primary text on dark. Never the primary CTA color |
| Electric Iris | `#5683da` | `--color-electric-iris` | **The** primary action color and active indicator — vivid violet-blue that reads as switched-on, not corporate |
| Ember Pulse | `#ff8964` | `--color-ember-pulse` | Secondary accent: notification dots, tag text, the aurora's warm stop. Punctuation, never a second primary |
| Molasses | `#5a250a` | `--color-molasses` | Deep ember for dark-context borders and tag fills when coral is too bright |

Semantic state colors (success, error) are **not** brand accents. The spec defines none; the app keeps its existing greens and reds under `--success`, `--error`, `--success-bg/-border`, `--error-bg/-border`.

## Surfaces

| Level | Name | Value | Token | Purpose |
|-------|------|-------|-------|---------|
| 0 | Obsidian Canvas | `#303236` | `--surface-obsidian-canvas` | Dark page background |
| 1 | Void | `#090a0c` | `--surface-void` | Deepest dark surface; input wells on dark |
| 2 | Charcoal Card | `#111111` | `--surface-charcoal-card` | Cards one step above the canvas |
| 3 | Light Canvas | `#ffffff` | `--surface-light-canvas` | Light cards and editorial bands |
| 4 | Linen | `#f6f6f6` | `--surface-linen` | Light page background; secondary light bands. Warmer than `--color-linen` |

Pick a background mode first. A component is dark or light, never both.

## Tokens — Typography

### Inter — all functional UI text · `--font-inter` → `font-sans`
Body, nav, buttons, list items, captions, small headings. Weight 500–600 for emphasis, 400 for body, 300 sparingly for quiet metadata. Loaded by `next/font` in `app/layout.tsx`.

### Display — hero headlines and section openers · `font-display`
The spec names **Esbuild**, a licensed face, and lists **Sora** (Google) and General Sans as substitutes. **Sora is what the code loads** (`--font-sora`, variable weight). Never below 28px; its tight tracking crushes small sizes. To adopt Esbuild: replace the `Sora()` loader in `app/layout.tsx` with `next/font/local` on the same variable name — nothing else changes.

### Type scale — one utility per role

| Role | Utility | Size | Line height | Tracking |
|------|---------|------|-------------|----------|
| caption | `text-caption` | 11px | 1.38 | -0.1px |
| body | `text-body` | 14px | 1.5 | -0.14px |
| body-lg | `text-body-lg` | 16px | 1.5 | -0.16px |
| subheading | `text-subheading` | 18px | 1.5 | -0.36px |
| heading-sm | `text-heading-sm` | 22px | 1.25 | — |
| heading | `text-heading` | 24px | 1.25 | -0.48px |
| display-sm | `text-display-sm` | 32px | 1 | -1.6px |
| display | `text-display` | 80px | 0.9 | -4px |

Each utility sets size, line-height and tracking together. The standalone `leading-*` and `tracking-*` tokens exist for the rare case a role's size is wanted alone. Tracking compresses with size: -0.14px at body, -4px at display.

## Tokens — Spacing & Shapes

**Base unit:** 4px · **Density:** comfortable

**Spacing:** 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 64, 160, 180, 240 px. This is Tailwind's default scale exactly (`p-1` … `p-60`), so pages use the utilities. The `--spacing-*` custom properties in `globals.css` document the scale; they are deliberately **not** in `@theme`, where `--spacing-4` would redefine `p-4` to 4px.

**Radii** (named, as utilities): `rounded-tags` 9999px · `rounded-buttons` 9999px · `rounded-cards` 12px · `rounded-inputs` 4px · `rounded-panels` 30px. The spec's generic names (`--radius-md` 4px, `--radius-3xl` 30px) are not defined because they would override Tailwind's `rounded-md`/`rounded-3xl`, which pages already use at Tailwind's sizes.

**Shadows:** `shadow-elevation-sm` `rgba(0,0,0,.15) 0 4px 6px` · `shadow-elevation-md` `rgba(0,0,0,.35) 0 4px 16px` · `shadow-elevation-xl` `rgba(0,0,0,.5) 0 6px 25px` · `shadow-subtle` `rgba(255,255,255,.4) 0 0 0 6px` (focus ring). Named "elevation" so they never overwrite Tailwind's `shadow-sm/md/xl`. On dark cards prefer borders to shadows.

**Layout:** `--page-max-width` 1200px · `--section-gap` 96px · `--card-padding` 24px · `--element-gap` 12px.

## Implementation notes

### The alias layer — how pages migrate without breaking

Every page reads one of 27 legacy variables (`--bg`, `--surface`, `--text`, `--text-muted`, `--accent`, `--sidebar-*`, …). `globals.css` now defines each as an alias onto a spec token, in both `[data-theme="dark"]` and `[data-theme="light"]`. Pages keep working unchanged and are moved onto the token names one commit at a time; an alias is removed only when nothing reads it.

| Legacy name | Dark | Light |
|---|---|---|
| `--bg` | Obsidian Canvas | Linen `#f6f6f6` |
| `--surface`, `--card`, `--sidebar-bg` | Charcoal Card | Snow |
| `--surface-raised` | *derived:* card mixed 15% toward Slate Edge | Linen `#e5e5e7` |
| `--border`, `--sidebar-border` | Slate Edge | Frost |
| `--border-light` | *derived:* Slate Edge at 50% | Linen `#e5e5e7` |
| `--text`, `--sidebar-text` | Snow | Void |
| `--text-secondary`, `--sidebar-muted` | Smoke | Iron Veil |
| `--text-muted` | Iron Veil | Smoke |
| `--accent`, `--sidebar-active` | Electric Iris | Electric Iris |
| `--accent-hover` | *derived:* Iris mixed 15% toward Void | same |
| `--bg-tertiary` (input wells) | Void | Linen `#f6f6f6` |
| `--sidebar-item-active/-hover` | white at 9% / 5% | black at 7% / 4% |
| `--success`, `--error` and their bg/border | unchanged | unchanged |
| `--skeleton-*` | Slate Edge / Iron Veil | Linen / Frost |

Note the dark mode inverts elevation: the canvas is `#303236` and cards are darker (`#111111`). The sidebar is therefore darker than the content area, which is the intended look.

### Measured contrast of the aliases (WCAG, before → after)

| Pair | Dark | Light |
|---|---|---|
| text on bg | 17.6 → 12.8 | 16.3 → 18.9 |
| text on surface | 16.0 → 18.9 | 17.4 → 20.4 |
| secondary on bg | 7.3 → **4.4** | 5.4 → 4.9 |
| secondary on surface | 6.7 → 6.5 | 5.7 → 5.3 |
| muted on bg | 2.6 → 2.4 | 2.7 → 2.7 |
| muted on surface | 2.3 → 3.6 | 2.9 → 2.9 |
| **accent on bg** | 7.5 → **3.5** | 4.8 → **3.4** |
| **accent on surface** | 6.9 → 5.1 | 5.2 → **3.7** |

Two consequences of the spec itself, flagged rather than silently altered: **Electric Iris used as small text** falls below AA (4.5:1) in both modes, where the previous blues passed; and dark secondary text on the canvas sits at 4.4. The brand color is kept exact. If small accent text needs AA, the fix is a derived `--accent-text` tone adopted page by page — an open decision, not part of the token commit.

### Tailwind integration

- Tokens live in `@theme static` so every variable is emitted even before a page uses its utility; the alias layer depends on that.
- Fonts live in `@theme inline` so `font-sans` / `font-display` carry the fallback chain and resolve the `next/font` variables set on `<html>`.
- Namespaces kept out of `@theme` because they would collide with Tailwind's own scale: spacing, generic radii, `shadow-sm/md/xl`. See each section above.
- Theme switching is `[data-theme]` on `<html>`: SSR renders `light`; `ThemeProvider` applies `localStorage['ora-theme']` or `prefers-color-scheme` on mount. A bare `:root` resolves to the dark set.

## Components

Reconstructions of the target language, in ORA terms. Mark each *implemented* in its page commit.

### Primary Pill Button
**Role:** the single most important action on a screen (Start, Save, Publish).
Filled Electric Iris, white text, Inter 14px weight 500, `rounded-buttons`, 12px 24px padding. Hover: `--accent-hover`. One per screen.

### Ghost Pill Button
**Role:** secondary actions, nav actions.
Transparent, 1px border (Slate Edge on dark, Frost on light), text in the surface's primary text color, Inter 14px weight 500, `rounded-buttons`, 10px 20px padding. Hover fills with the surface's raised tone.

### Card
**Role:** every panel in the dashboard, feature cards on the landing page.
Charcoal Card on dark / Snow on light, `rounded-cards`, `--card-padding` 24px, 1px border in the surface's border color. **Borders, not shadows, for elevation on dark.** An optional radial Ember glow bleeding from one corner is the only decoration.

### Tag / Chip
**Role:** status badges, filter pills, project and client labels.
`rounded-tags`, 4px 10px padding, Inter 11px weight 500, text in the category color, background the same color at 12% opacity. Electric Iris for active/selected, Ember Pulse for attention, Ash for done/archived.

### Top Navigation (landing)
Transparent over the hero, backdrop blur once scrolled. Logo left, Inter 14px links center, outlined *Sign in* ghost pill and filled *Sign up* iris pill right.

### Aurora Hero Background (landing only)
A narrow vertical beam on Void: `linear-gradient(180deg, Electric Iris @60% → Ember Pulse → white)`, 15–25% of page width, with a warm radial sunburst (`#ffaa81 → #ffda9f → transparent`) at its base. **Once per page.** Never a full-surface fill.

### Light Section Band (landing)
Snow or `--surface-linen` background, display heading in Void, Inter body in Obsidian Canvas. Dark hero → light band → dark band is the page's structural rhythm, with `--section-gap` between.

### Product Screenshot Frame (landing)
A real dashboard screenshot inside a `rounded-cards` frame with `shadow-elevation-xl`, floating over the aurora. The product is the photography — no stock imagery, no 3D renders.

## Do's and Don'ts

### Do
- Use `rounded-buttons`/`rounded-tags` (9999px) for every button, tag and pill control — pill geometry is the system's signature shape
- Reserve the display face for 28px and up; never for body, nav, or anything below 22px
- Pick a background mode first: dark canvas for product screens, Snow/Linen for editorial bands — never blend them in one component
- Use Electric Iris for the single most important action per screen; let Ember Pulse appear only as warm punctuation
- Apply the aurora gradient as one narrow beam per page, never as a background fill
- Set body text to `text-body` (14px / 1.5 / -0.14px) and let tracking tighten with size
- On dark cards, delineate with Slate Edge borders, not drop shadows

### Don't
- Don't use sharp corners (0–8px) on buttons or tags
- Don't introduce a third accent — iris and ember are the entire chromatic vocabulary; success and error are state, not accent
- Don't put Obsidian Canvas text on the dark canvas, or white text on a white band — the dark palette has narrow readable bands; check the contrast table
- Don't let dashboard tokens into `ReportPDF.tsx`
- Don't add `--spacing-*`, `--radius-md`/`-3xl`, or `--shadow-sm/md/xl` to `@theme` — see Implementation notes for what each would break

## Gradient System

**Aurora beam** (hero only): `linear-gradient(180deg, #5683da99, #ff8964, #ffffff)` as a narrow vertical streak. Once per page.

**Radial sunburst** (card glows): `radial-gradient(#ffaa81, #ffda9f, transparent)` as a 200–400px circle bleeding from a card corner at 30–50% opacity.

**Section transition** (rare): white → `#d5d8f6` for a light-to-product bridge.

Never stack two full-opacity gradients in one viewport.

## Similar Brands
Linear (dark canvas, one vivid accent, pill controls, product-UI-as-hero) · Vercel (vertical beam hero, 80px display with tight tracking) · Arc (dark-first, warm-to-cool washes) · Resend (alternating dark/light bands, minimal shadow, 9999px buttons) · Stripe (gradient beams, screenshots over atmosphere, Inter as the workhorse).
