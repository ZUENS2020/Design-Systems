# Site Generation Contract

The build pipeline produces a static catalog site for Cloudflare Pages.

Stable routes:

- `/`
- `/systems/:slug/`
- `/raw/:filename`
- `/manifest/design-systems.json`
- `/manifest/design-systems.min.json`
- `/llms.txt`
- `/sitemap.xml`

Build responsibilities:

- Validate every canonical HTML file
- Extract embedded metadata
- Reject duplicate `slug` or `id`
- Copy canonical HTML files into `/raw/`
- Generate per-system detail wrappers into `/systems/:slug/`
- Generate the searchable catalog homepage
- Generate agent-facing and machine-facing manifest files

Deployment model:

- GitHub push triggers Cloudflare Pages build
- Preview deployments are enabled for pull requests
- `SITE_ORIGIN` may override the default origin from `site.config.json` during build
