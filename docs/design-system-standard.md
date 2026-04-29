# Design System HTML Standard

Every canonical design system document in this repository is a standalone HTML file named `{SystemName}_Design_System.html`.

Required document contract:

- One embedded metadata block:
  - `<script id="design-system-metadata" type="application/json">...</script>`
- English-first content.
- Six sections in this exact order and with these exact IDs:
  - `overview`
  - `foundations`
  - `components`
  - `motion`
  - `iconography`
  - `voice-tone`
- At least one alternate theme, declared in metadata and implemented through semantic token overrides.
- No external CSS or JS imports except Google Fonts.

Required document markers:

- Canonical system title in `<title>`
- System name and concept visible in the hero area
- Section navigation linking to the fixed section IDs
- Theme toggle or theme indication for the declared alternate theme

Token contract:

- Spacing tokens: `--sp-1` through `--sp-10`
- Type tokens:
  - `--fs-12`, `--fs-14`, `--fs-16`, `--fs-20`, `--fs-28`, `--fs-40`, `--fs-64`, `--fs-96`
  - Matching line-height tokens `--lh-*`
- Semantic roles:
  - `--fg-0`, `--fg-1`, `--fg-2`
  - `--bg-0`, `--bg-1`, `--bg-2`
  - `--line`
  - `--accent`

Component CSS must consume semantic tokens and spacing/type tokens rather than hard-coded values.
