# Metadata and Indexing Standard

Each canonical HTML document must embed one machine-readable metadata object that conforms to `schemas/design-system-metadata.schema.json`.

Required metadata fields:

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

Rules:

- `slug` and `id` must be globally unique in the repo.
- `source.file` must match the canonical HTML filename.
- `searchText` should contain the highest-value retrieval terms for both humans and agents.
- The site generator reads metadata only from the embedded JSON block; it does not scrape visible prose as a source of truth.
- The build pipeline emits:
  - `manifest/design-systems.json`
  - `manifest/design-systems.min.json`
  - `llms.txt`
  - `sitemap.xml`
