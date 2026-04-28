# Design Systems — Claude Instructions

## Repository purpose

This repo holds self-contained single-file HTML design system documents. Each file
is a live, interactive style guide for a concept-driven design system.

## File naming

`{SystemName}_Design_System.html` — PascalCase, underscores between words.

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
   Iconography · Voice & Tone. Order and section IDs are fixed.

5. **Alternate theme** — at least one `[data-theme="…"]` override that flips
   semantic role tokens only.

6. **Self-contained** — one `.html` file, no JS/CSS imports except Google Fonts.

## Existing systems

| File | Concept |
|---|---|
| `Edge_Runner_Design_System.html` | Mirror's Edge — stark near-monochrome + Runner Red accent, sharp geometry |
| `Playtime_Design_System.html` | Jacques Tati's *Playtime* (1967) — modernist glass architecture, two-mode palette |
