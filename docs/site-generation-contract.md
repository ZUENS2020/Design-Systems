# Site Generation Contract

The build pipeline produces a static catalog site for Cloudflare Pages.

Source layout:

- `design-systems/*.html`
- `catalog/metadata/*.json`

Stable routes:

- `/`
- `/systems/:slug/`
- `/raw/:filename`
- `/manifest/design-systems.json`
- `/manifest/design-systems.min.json`
- `/llms.txt`
- `/sitemap.xml`

Build responsibilities:

- validate every sidecar metadata file
- verify each source HTML exists
- verify each declared section anchor exists in the source HTML
- reject duplicate `slug` or `id`
- copy canonical HTML files into `/raw/`
- generate per-system detail wrappers into `/systems/:slug/`
- generate the searchable catalog homepage

The generator must not mutate canonical design system HTML.
