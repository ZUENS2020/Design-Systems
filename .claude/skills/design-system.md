---
name: design-system
description: >
  Generate a complete, self-contained single-file HTML design system document
  for this repository. Each system is rooted in a cinematic or artistic concept
  that drives every decision — colors, type, motion, copy, and iconography.
  Invoke with: /design-system <SystemName> [concept hint]
triggers:
  - /design-system
  - "create a design system"
  - "new design system"
  - "generate design system"
---

# Design System Generation Skill

## Purpose

Produce a single `.html` file named `{SystemName}_Design_System.html` that fully
documents and live-demos a themed design system. Every system must be rooted in a
**cinematic, artistic, or cultural concept** — this concept is the north star for
every decision.

---

## Phase 0 — Concept Brief (always first)

Before writing any code, establish the brief in conversation:

| Field | Description |
|---|---|
| **System name** | The name shown in the navbar brand and `<title>` |
| **Concept** | The cinematic/artistic/cultural inspiration (required) |
| **Mood** | One sentence: what it feels like to use it |
| **Accent strategy** | How many signal colors, and what they symbolize |
| **Alternate theme** | What the secondary `[data-theme]` expresses (can be none) |

Only proceed to Phase 1 after the concept is locked.

---

## Phase 1 — Design Tokens

Define all tokens as CSS custom properties on `:root`. Every token must be
justified by the concept — no arbitrary values.

### 1.1 Neutral Scale

A named neutral ramp of **8–10 steps** from lightest to darkest. Name stops
semantically (e.g. `--paper`, `--smoke`, `--ink`) rather than purely numerically.
Reserve purely numeric suffixes (`-200` through `-700`) for intermediate stops.

```css
/* example — concept drives the hue angle and saturation */
--bg-lightest:  #…;
--neutral-200:  #…;
/* … */
--fg-darkest:   #…;
```

### 1.2 Semantic Color Roles

Map neutral stops to role tokens. All components use roles, never raw stops.

| Token | Purpose |
|---|---|
| `--fg-0` | Primary text / icons |
| `--fg-1` | Secondary text |
| `--fg-2` | Disabled / placeholder |
| `--fg-inv` | Text on dark/accent surfaces |
| `--bg-0` | Page background |
| `--bg-1` | Raised surface (card, input) |
| `--bg-2` | Sunken / nested surface |
| `--line` | Default border |
| `--line-strong` | Emphasis border |
| `--accent` | Primary signal color |
| `--accent-2` | Secondary signal (if concept warrants it) |

### 1.3 Signal / Accent Colors

Concept-derived. Maximum 2 primary accents plus semantic utility colors:

```css
--success:  #…;
--warning:  #…;
--danger:   #…;
```

Use accents **sparingly** — no more than 5 % of any surface area.

### 1.4 Typography

```css
--font-sans:  'PrimaryFace', fallback-stack;
--font-mono:  'MonoFace', ui-monospace, SFMono-Regular, Menlo, monospace;
```

Choose typefaces from Google Fonts that reinforce the concept. Use `@import` at
the top of `<style>`.

**Type scale** — fixed 7-step scale, always these exact token names:

```css
--fs-12: 12px;  --lh-12: 16px;
--fs-14: 14px;  --lh-14: 20px;
--fs-16: 16px;  --lh-16: 24px;
--fs-20: 20px;  --lh-20: 28px;
--fs-28: 28px;  --lh-28: 32px;
--fs-40: 40px;  --lh-40: 44px;
--fs-64: 64px;  --lh-64: 64px;
--fs-96: 96px;  --lh-96: 88px;
```

### 1.5 Spacing

4 px base unit. Always use this exact 10-step scale:

```css
--sp-1:  4px;   --sp-2:  8px;   --sp-3:  12px;  --sp-4:  16px;  --sp-5:  24px;
--sp-6:  32px;  --sp-7:  48px;  --sp-8:  64px;  --sp-9:  96px;  --sp-10: 128px;
```

Never hard-code spacing values in component CSS — always reference `var(--sp-N)`.

### 1.6 Radius

Concept determines whether corners are sharp or soft:

```css
--r-0:    0;
--r-1:    2px;   /* or concept-specific small radius */
--r-2:    4px;   /* or concept-specific medium radius */
--r-full: 9999px;
```

For pill-heavy concepts add `--r-pill`. For card-specific radius add `--r-card`.

### 1.7 Shadows

Name shadows semantically, not by visual description:

```css
--shadow-lift:   …;  /* default elevation */
--shadow-float:  …;  /* popover / modal */
--shadow-focus:  …;  /* keyboard focus ring */
--shadow-inset:  …;  /* pressed / inset state (if needed) */
```

### 1.8 Motion

Every system must define **ease curves** and **duration tokens** derived from the
concept's emotional tempo. Slow and cinematic ≠ fast and snappy.

```css
/* Named ease curves */
--ease-primary:  cubic-bezier(…);
--ease-enter:    cubic-bezier(…);
--ease-exit:     cubic-bezier(…);
--ease-std:      cubic-bezier(.4, 0, .2, 1);

/* Duration tokens (min 3, max 5) */
--dur-instant:  80ms;
--dur-fast:     160ms;
--dur-base:     280ms;
--dur-slow:     480ms;
--dur-crawl:    720ms;  /* if concept warrants it */
```

---

## Phase 2 — Alternate Theme

If the concept has a second mode (night, festive, high-contrast, chromatic
release…), override semantic role tokens only — never neutrals or type scales:

```css
[data-theme="alternate"] {
  --bg-0: …;
  --fg-0: …;
  /* … role overrides only … */
}
```

---

## Phase 3 — Semantic Type Roles

Define utility classes that components reference. Always include all roles:

```css
.t-display-xl { font-size: var(--fs-96); line-height: var(--lh-96); font-weight: …; letter-spacing: …; }
.t-display-l  { font-size: var(--fs-64); … }
.t-display-m  { font-size: var(--fs-40); … }
.t-h1         { font-size: var(--fs-28); … }
.t-h2         { font-size: var(--fs-20); … }
.t-h3         { font-size: var(--fs-16); … }
.t-body       { font-size: var(--fs-16); color: var(--fg-1); font-weight: 400; }
.t-body-s     { font-size: var(--fs-14); color: var(--fg-1); font-weight: 400; }
.t-caption    { font-size: var(--fs-12); color: var(--fg-2); font-weight: 400; }
.t-eyebrow    { font-size: var(--fs-12); font-weight: 700; text-transform: uppercase; letter-spacing: …; color: var(--fg-1); }
.t-mono       { font-family: var(--font-mono); font-size: var(--fs-14); font-weight: 500; }
.t-mono-s     { font-family: var(--font-mono); font-size: var(--fs-12); font-weight: 500; color: var(--fg-2); }
```

Add one extra role if the concept demands it (`.t-signage`, `.t-label`, etc.).

---

## Phase 4 — Document Structure

The HTML file is a single-page app with **6 sections** driven by a sticky navbar.
Section order is fixed:

| # | `data-section` | Nav label | Marker |
|---|---|---|---|
| 1 | `overview` | Overview | — |
| 2 | `foundations` | Foundations | · 01 · |
| 3 | `components` | Components | · 02 · |
| 4 | `motion` | Motion | · 03 · |
| 5 | `iconography` | Iconography / Pictograms | · 04 · |
| 6 | `copy` | Voice & Tone | · 05 · |

### Navbar requirements

```html
<nav class="navbar">
  <div class="brand"><!-- SVG logo + system name --></div>
  <div class="nav-links">
    <button class="nav-link active" data-section="overview">Overview</button>
    <!-- … remaining tabs … -->
  </div>
  <div class="spacer"></div>
  <button class="theme-toggle" id="themeToggle"><!-- toggle label --></button>
</nav>
```

- Sticky, `z-index: 100`, `backdrop-filter: blur(12px)`
- Active tab has concept-color underline rule (2 px, using `--accent` or `--line-strong`)
- Theme toggle cycles through available `[data-theme]` values

### Section switching (JS)

```js
const links = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');

links.forEach(link => {
  link.addEventListener('click', () => {
    const id = link.getAttribute('data-section');
    links.forEach(l => l.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active'));
    link.classList.add('active');
    document.getElementById(id).classList.add('active');
  });
});

// Theme toggle
const toggle = document.getElementById('themeToggle');
const themes = ['default', /* … alternate names … */];
let themeIdx = 0;
toggle.addEventListener('click', () => {
  themeIdx = (themeIdx + 1) % themes.length;
  document.documentElement.setAttribute('data-theme', themes[themeIdx] === 'default' ? '' : themes[themeIdx]);
  toggle.querySelector('span').textContent = themes[(themeIdx + 1) % themes.length];
});
```

---

## Phase 5 — Section Content Checklist

### 5.1 Overview

- Hero with system name (`.t-display-l` or larger), concept tagline
- **Design Pillars** — 4–6 bullet principles, each one a short rule derived from the concept
- **Core Specifications** — plain-text summary: primary colors, typeface names, spacing base, motion signature

### 5.2 Foundations

**Color**
- Neutral scale swatches: `div.swatch > .swatch-color + .swatch-name + .swatch-value`
- Signal / accent swatches in a separate `color-grid`
- Semantic role table: token name → raw value → usage note

**Typography**
- Full type specimen: one live text block per role class (`.t-display-xl` through `.t-mono-s`)
- Show `font-size / line-height / weight / tracking` as metadata per row

**Spacing**
- Visual ruler grid: each step rendered as a colored bar whose width or height equals the token value, labeled with token name and pixel value

**Radius + Shadows**
- Live demo tiles: one tile per radius token showing `border-radius`
- One tile per shadow token showing the shadow applied to a surface

### 5.3 Components

Minimum required components (adapt styling to concept):

| Component | Variants |
|---|---|
| Button | Primary, Secondary, Ghost, Destructive, Disabled |
| Input / Text field | Default, Focus, Error, Disabled |
| Badge / Tag | Default, Accent, Success, Warning, Danger |
| Card | Default (with header, body, footer) |
| Alert / Banner | Info, Success, Warning, Error |
| Toggle / Switch | On, Off, Disabled |
| Select / Dropdown | Collapsed, Open |
| Modal (static demo) | With overlay, close button, content slots |

Each component block must include:
1. Live rendered demo
2. Token annotation — which `--tokens` apply to which properties
3. State coverage (hover, focus, active, disabled shown side-by-side)

### 5.4 Motion

- **Ease curve gallery** — SVG bezier visualizer for each `--ease-*` curve, with name and formula
- **Duration table** — all `--dur-*` tokens, their values, and example use cases
- **Live demos** — at least 3 interactive demos (button press, modal enter/exit, page transition) that use `var(--ease-primary)` and `var(--dur-base)`

### 5.5 Iconography / Pictograms

- Grid of ≥ 20 SVG icons named and relevant to the concept's world
- Naming convention shown (`icon-{noun}` kebab-case)
- Size tokens: 16 px / 20 px / 24 px / 32 px demonstrated
- Stroke weight rule documented (e.g. "1.5 px at 24 px viewport")
- Color rule: icons inherit `currentColor`; accent usage guideline

### 5.6 Voice & Tone

- **3–5 principles** — concept-derived writing rules (e.g. "Use the present tense", "Avoid jargon that contradicts the world")
- **Do / Don't pairs** — ≥ 5 pairs, formatted as two-column comparison cards
- **Error message examples** — 3 scenarios (validation, network, empty state) in the system's voice
- **Microcopy samples** — button labels, tooltip text, placeholder text

---

## Phase 6 — Quality Checklist

Before delivering the file, verify:

- [ ] No hard-coded color hex in component CSS (only `var(--token)`)
- [ ] No hard-coded spacing px values (only `var(--sp-N)`)
- [ ] All interactive elements have `:hover`, `:focus-visible`, and `[disabled]` states
- [ ] Focus ring uses `--shadow-focus` (keyboard accessible)
- [ ] `<html lang="…">` set correctly
- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- [ ] `<title>` matches system name
- [ ] Alternate theme toggle works in both directions
- [ ] All 6 sections navigate correctly (no JS errors)
- [ ] File is fully self-contained — no external dependencies except Google Fonts `@import`
- [ ] File name follows convention: `{SystemName}_Design_System.html`

---

## Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| File | `{PascalCase}_Design_System.html` | `Noir_Velvet_Design_System.html` |
| CSS token | `--{semantic-role}-{step}` | `--fg-1`, `--sp-4`, `--dur-base` |
| Type class | `.t-{role}` | `.t-eyebrow`, `.t-display-m` |
| Component class | `.{component}-{variant}` | `.btn-primary`, `.badge-success` |
| Section id | `{section}` (no prefix) | `id="foundations"` |
| Icon id/class | `icon-{noun}` (kebab) | `icon-arrow-right`, `icon-grid` |
| Data attribute | `data-{property}` | `data-theme="royal-garden"` |

---

## Anti-Patterns to Avoid

- Hard-coded colors or spacing in component rules
- Generic names (`primary`, `secondary`) that don't reflect the concept
- More than 2 accent colors actively competing for attention
- Motion with `ease-in` starts (abrupt) or spring overshoot (rarely concept-appropriate)
- Components that ignore dark/alternate theme (always test both)
- Icon sets borrowed directly from popular libraries without restyling to match the concept's stroke weight and geometry
- Placeholder "Lorem ipsum" copy in Voice & Tone — write in the system's actual voice
