# Cloudflare Pages Deployment

This repo is intended to deploy as a static Cloudflare Pages site with GitHub auto-sync.

## Recommended setup

Cloudflare Pages project:

- Connect the GitHub repository
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`

Optional environment variables:

- `SITE_ORIGIN`
  - production example: `https://your-domain.example`
  - preview example: let Pages default if not needed

## Generated routes

The build produces these stable routes:

- `/`
- `/systems/:slug/`
- `/raw/:filename`
- `/manifest/design-systems.json`
- `/manifest/design-systems.min.json`
- `/llms.txt`
- `/sitemap.xml`

## Build flow

`npm run build` performs four steps implicitly:

1. discover canonical HTML design systems
2. validate embedded metadata, sections, and theme declarations
3. build the aggregate manifest
4. emit the static catalog site into `dist/`

If validation fails, the build should fail and Pages should not publish the new deployment.
