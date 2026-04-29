# Design System HTML Standard

Canonical design system documents live in `design-systems/` and remain standalone HTML files named `{SystemName}_Design_System.html`.

Core rules:

- The HTML document is the canonical design artifact.
- The catalog system must not rewrite or inject metadata into canonical HTML.
- No external CSS or JS imports except Google Fonts.
- English-first content is preferred.
- Existing interaction and layout structure are allowed to vary between systems.

Catalog integration rules:

- Every canonical HTML document must have a matching sidecar JSON file in `catalog/metadata/`.
- The sidecar file declares:
  - discovery metadata
  - tags and themes
  - source path
  - the section anchor IDs that exist inside the HTML
- Validation checks that the section IDs declared in sidecar metadata actually exist in the source HTML.

This keeps the design systems untouched while still making the repository searchable and agent-friendly.
