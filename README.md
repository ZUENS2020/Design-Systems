# Concept-Driven Design Systems

This repository now keeps canonical design system HTML separate from catalog metadata.

Structure:

- `design-systems/`
  - canonical single-file HTML design systems
- `catalog/metadata/`
  - sidecar JSON metadata used for search, manifests, and agent access
- `docs/`
  - repo standards and deployment notes
- `scripts/`
  - validation and static catalog generation

The website, search index, and agent-facing manifests are generated from sidecar metadata. The design system HTML files themselves are preserved as source artifacts and copied through unchanged.

## Current Systems

- `design-systems/Edge_Runner_Design_System.html`
- `design-systems/Playtime_Design_System.html`
- `design-systems/Suzuka_Design_System.html`

## Standards

- [docs/design-system-standard.md](/Users/zuens2020/Documents/Design-Systems/docs/design-system-standard.md)
- [docs/metadata-indexing-standard.md](/Users/zuens2020/Documents/Design-Systems/docs/metadata-indexing-standard.md)
- [docs/site-generation-contract.md](/Users/zuens2020/Documents/Design-Systems/docs/site-generation-contract.md)
- [docs/cloudflare-pages-deploy.md](/Users/zuens2020/Documents/Design-Systems/docs/cloudflare-pages-deploy.md)

## Local Commands

```bash
npm test
npm run validate
npm run build
```

Validation checks:

- sidecar metadata presence and shape
- source HTML path correctness
- declared section IDs exist in canonical HTML
- duplicate `id` and `slug`

## Cloudflare Pages

Recommended settings:

- Build command: `npm run build`
- Build output directory: `dist`

The current Pages project can auto-deploy from `main` after each push.
