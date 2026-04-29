# Concept-Driven Design Systems

This repository now serves two roles at once:

- a collection of canonical single-file HTML design systems
- a buildable static catalog site for Cloudflare Pages

Each design system remains a standalone HTML artifact. The website, search index, and agent-facing manifests are generated from the embedded metadata inside those HTML files.

## Repository Model

Canonical source files:

- `*_Design_System.html`

Repository standards:

- [docs/design-system-standard.md](/Users/zuens2020/Documents/Design-Systems/docs/design-system-standard.md)
- [docs/metadata-indexing-standard.md](/Users/zuens2020/Documents/Design-Systems/docs/metadata-indexing-standard.md)
- [docs/site-generation-contract.md](/Users/zuens2020/Documents/Design-Systems/docs/site-generation-contract.md)

Schemas:

- [schemas/design-system-metadata.schema.json](/Users/zuens2020/Documents/Design-Systems/schemas/design-system-metadata.schema.json)
- [schemas/design-systems-manifest.schema.json](/Users/zuens2020/Documents/Design-Systems/schemas/design-systems-manifest.schema.json)

Build outputs:

- `dist/index.html`
- `dist/systems/:slug/`
- `dist/raw/:filename`
- `dist/manifest/design-systems.json`
- `dist/manifest/design-systems.min.json`
- `dist/llms.txt`
- `dist/sitemap.xml`

## Current Systems

- `Edge_Runner_Design_System.html`
- `Playtime_Design_System.html`
- `Suzuka_Design_System.html`

## Local Commands

This project has no runtime dependencies beyond Node.js.

```bash
npm test
npm run validate
npm run build
```

Validation checks:

- embedded metadata presence and shape
- fixed section IDs and order
- theme declarations
- duplicate `id` and `slug`

## Cloudflare Pages

Recommended Pages settings:

- Framework preset: `None`
- Build command: `npm run build`
- Build output directory: `dist`

Optional environment variable:

- `SITE_ORIGIN`
  - use this to override the default origin in `site.config.json` during build

GitHub is the intended source of truth. A push to the production branch should trigger a new Pages deployment automatically.

## Agent-Friendly Surfaces

The build emits two machine-readable manifests plus `llms.txt`:

- `/manifest/design-systems.json`
- `/manifest/design-systems.min.json`
- `/llms.txt`

Agents should prefer the embedded metadata inside canonical HTML files when working in-repo, and the generated manifests when working against the deployed site.
