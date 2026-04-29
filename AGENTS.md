# Design Systems — Codex Instructions

## Repository purpose

This repo holds self-contained single-file HTML design system documents. Each file
is a live, interactive style guide for a concept-driven design system.

## Repository structure

- Canonical design system HTML files live in `design-systems/`.
- Catalog metadata lives in `catalog/metadata/` as sidecar JSON.
- The catalog site reads sidecar metadata and must not rewrite canonical HTML.

## File naming

- HTML: `{SystemName}_Design_System.html` — PascalCase, underscores between words.
- Metadata: `{slug}.json` — kebab-case, stored in `catalog/metadata/`.

## Skill: /design-system

Use the `/design-system` skill to generate a new design system document.
The skill is defined in `.claude/skills/design-system.md`.

Invoke as: `/design-system <SystemName> [concept hint]`

Examples:
- `/design-system Solarpunk` — builds a solarpunk-themed system
- `/design-system NeonBazaar retro night-market aesthetic`

The skill enforces all structural, token, and quality standards described below.

## Standards summary

Every design system in this repo must follow these rules (full spec in the skill):

1. **Concept-driven** — every token, typeface, and copy principle traces back to
   the cinematic/artistic concept. No arbitrary aesthetics.

2. **Token hygiene** — zero hard-coded colors or spacing values in component CSS.
   All values reference `var(--token-name)`.

3. **Fixed token names** — spacing (`--sp-1` … `--sp-10`), type scale
   (`--fs-12` … `--fs-96` + matching `--lh-*`), semantic roles
   (`--fg-0/1/2`, `--bg-0/1/2`, `--line`, `--accent`).

4. **Six sections** — Overview · Foundations · Components · Motion ·
   Iconography · Voice & Tone. Order is fixed. Section IDs must be declared in
   sidecar metadata and must match anchors that actually exist in the HTML.

5. **Alternate theme** — at least one `[data-theme="…"]` override that flips
   semantic role tokens only.

6. **Self-contained** — one `.html` file, no JS/CSS imports except Google Fonts.

7. **Catalog-safe** — catalog metadata should live in sidecar JSON by default,
   not be injected into canonical HTML unless explicitly requested.

## Catalog metadata

Each canonical HTML file must have a matching sidecar JSON file in
`catalog/metadata/`. The JSON is the source of truth for search and agent-facing
catalog data.

Recommended metadata fields:

- `id`
- `slug`
- `name`
- `title`
- `concept`
- `inspiration`
- `summary`
- `tags`
- `themes`
- `locale`
- `status`
- `version`
- `searchText`
- `source.file`
- `source.repoPath`
- `updatedAt`
- `sections`

## Existing systems

| File | Concept |
|---|---|
| `design-systems/Edge_Runner_Design_System.html` | Mirror's Edge — stark near-monochrome + Runner Red accent, sharp geometry |
| `design-systems/Playtime_Design_System.html` | Jacques Tati's *Playtime* (1967) — modernist glass architecture, two-mode palette |
| `design-systems/Suzuka_Design_System.html` | Silent Suzuka / race-bred calm — speed, restraint, aerodynamic clarity |
