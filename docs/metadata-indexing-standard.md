# Metadata and Indexing Standard

Metadata is stored in sidecar JSON files under `catalog/metadata/`. It is not embedded into canonical HTML by default.

Each sidecar file must conform to `schemas/design-system-metadata.schema.json`.

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
- `sections`
- `source.file`
- `source.repoPath`
- `updatedAt`

Rules:

- `slug` and `id` must be globally unique.
- `source.repoPath` must point to the canonical HTML under `design-systems/`.
- `sections` is the source of truth for catalog anchors and section labels.
- The validator checks that every declared section ID exists in the source HTML.
- The site generator reads sidecar JSON as the metadata source of truth and copies canonical HTML through unchanged.
