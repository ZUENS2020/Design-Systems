import path from 'node:path';
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';

export const REQUIRED_SECTION_IDS = [
  'overview',
  'foundations',
  'components',
  'motion',
  'iconography',
  'voice-tone'
];

const REQUIRED_METADATA_KEYS = [
  'id',
  'slug',
  'name',
  'title',
  'concept',
  'inspiration',
  'summary',
  'tags',
  'themes',
  'locale',
  'status',
  'version',
  'searchText',
  'source',
  'updatedAt'
];

export async function collectDesignSystemFiles(rootDir) {
  const entries = await readdir(rootDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /_Design_System\.html$/.test(entry.name))
    .map((entry) => path.join(rootDir, entry.name))
    .sort();
}

export function extractMetadataFromHtml(html) {
  const match = html.match(/<script\s+id="design-system-metadata"\s+type="application\/json">([\s\S]*?)<\/script>/i);
  if (!match) {
    throw new Error('Missing embedded metadata block #design-system-metadata');
  }

  try {
    return JSON.parse(match[1].trim());
  } catch (error) {
    throw new Error(`Invalid metadata JSON: ${error.message}`);
  }
}

export function extractSectionIds(html) {
  const ids = [];
  const pattern = /<section\s+[^>]*id="([^"]+)"/gi;
  let match = pattern.exec(html);
  while (match) {
    ids.push(match[1]);
    match = pattern.exec(html);
  }
  return ids;
}

function assertString(metadata, key) {
  if (typeof metadata[key] !== 'string' || metadata[key].trim() === '') {
    throw new Error(`Invalid metadata field "${key}"`);
  }
}

function assertStringArray(metadata, key) {
  if (!Array.isArray(metadata[key]) || metadata[key].length === 0 || metadata[key].some((item) => typeof item !== 'string' || item.trim() === '')) {
    throw new Error(`Invalid metadata field "${key}"`);
  }
}

function validateMetadata(metadata, filePath, rootDir) {
  for (const key of REQUIRED_METADATA_KEYS) {
    if (!(key in metadata)) {
      throw new Error(`Missing required metadata field "${key}"`);
    }
  }

  for (const key of ['id', 'slug', 'name', 'title', 'concept', 'inspiration', 'summary', 'locale', 'status', 'version', 'searchText', 'updatedAt']) {
    assertString(metadata, key);
  }

  assertStringArray(metadata, 'tags');
  assertStringArray(metadata, 'themes');

  if (!/^[a-z0-9-]+$/.test(metadata.id)) {
    throw new Error('Metadata "id" must be lowercase kebab-case');
  }

  if (!/^[a-z0-9-]+$/.test(metadata.slug)) {
    throw new Error('Metadata "slug" must be lowercase kebab-case');
  }

  if (metadata.locale !== 'en') {
    throw new Error('Metadata "locale" must be "en"');
  }

  if (!['draft', 'stable'].includes(metadata.status)) {
    throw new Error('Metadata "status" must be "draft" or "stable"');
  }

  if (!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(metadata.version)) {
    throw new Error('Metadata "version" must be semver-like');
  }

  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(metadata.updatedAt)) {
    throw new Error('Metadata "updatedAt" must use YYYY-MM-DD');
  }

  if (!metadata.source || typeof metadata.source !== 'object') {
    throw new Error('Metadata "source" must be an object');
  }

  if (typeof metadata.source.file !== 'string' || typeof metadata.source.repoPath !== 'string') {
    throw new Error('Metadata "source.file" and "source.repoPath" are required');
  }

  const expectedFile = path.basename(filePath);
  if (metadata.source.file !== expectedFile) {
    throw new Error(`Metadata source.file "${metadata.source.file}" must match filename "${expectedFile}"`);
  }

  const expectedRepoPath = path.relative(rootDir, filePath).split(path.sep).join('/');
  if (metadata.source.repoPath !== expectedRepoPath) {
    throw new Error(`Metadata source.repoPath "${metadata.source.repoPath}" must match repo path "${expectedRepoPath}"`);
  }
}

function validateSections(sectionIds) {
  const found = sectionIds.filter((id) => REQUIRED_SECTION_IDS.includes(id));
  if (found.length !== REQUIRED_SECTION_IDS.length) {
    throw new Error(`Missing required section ids. Expected: ${REQUIRED_SECTION_IDS.join(', ')}`);
  }

  const actual = found.join('|');
  const expected = REQUIRED_SECTION_IDS.join('|');
  if (actual !== expected) {
    throw new Error(`Required section ids must appear in order: ${REQUIRED_SECTION_IDS.join(', ')}`);
  }
}

function validateThemes(metadata, html) {
  for (const theme of metadata.themes) {
    const selector = `[data-theme="${theme}"]`;
    const htmlAttr = `data-theme="${theme}"`;
    if (!html.includes(selector) && !html.includes(htmlAttr)) {
      throw new Error(`Theme "${theme}" is declared in metadata but not found in HTML`);
    }
  }
}

export async function validateDesignSystemFile(filePath, rootDir = path.dirname(filePath)) {
  const html = await readFile(filePath, 'utf8');
  const metadata = extractMetadataFromHtml(html);
  const sections = extractSectionIds(html);

  validateMetadata(metadata, filePath, rootDir);
  validateSections(sections);
  validateThemes(metadata, html);

  return {
    filePath,
    html,
    metadata,
    sections
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderShell({ title, body, description }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}"/>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --fg-0: #121212;
      --fg-1: #383838;
      --fg-2: #666666;
      --bg-0: #f7f5ef;
      --bg-1: #ece8de;
      --bg-2: #dfd9cc;
      --line: #cbc2b0;
      --accent: #c4472d;
      --sp-1: 4px;
      --sp-2: 8px;
      --sp-3: 12px;
      --sp-4: 16px;
      --sp-5: 24px;
      --sp-6: 32px;
      --sp-7: 48px;
      --sp-8: 64px;
      --sp-9: 96px;
      --sp-10: 128px;
      --fs-12: 12px;
      --fs-14: 14px;
      --fs-16: 16px;
      --fs-20: 20px;
      --fs-28: 28px;
      --fs-40: 40px;
      --fs-64: 64px;
      --fs-96: 96px;
      --lh-12: 16px;
      --lh-14: 20px;
      --lh-16: 24px;
      --lh-20: 28px;
      --lh-28: 34px;
      --lh-40: 46px;
      --lh-64: 68px;
      --lh-96: 96px;
      --font-sans: "Manrope", sans-serif;
      --font-mono: "IBM Plex Mono", monospace;
      --shadow: 0 24px 80px rgba(18, 18, 18, 0.08);
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      font-family: var(--font-sans);
      color: var(--fg-0);
      background:
        radial-gradient(circle at top left, rgba(196, 71, 45, 0.08), transparent 34%),
        linear-gradient(180deg, var(--bg-0), #fbfaf7);
    }
    a { color: inherit; }
    .page { width: min(1120px, calc(100% - 48px)); margin: 0 auto; }
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--sp-4);
      padding: var(--sp-5) 0;
      border-bottom: 1px solid rgba(203, 194, 176, 0.5);
    }
    .brand {
      font-weight: 800;
      letter-spacing: -0.03em;
      font-size: var(--fs-20);
      text-decoration: none;
    }
    .brand span {
      display: block;
      font-family: var(--font-mono);
      font-size: var(--fs-12);
      line-height: var(--lh-12);
      color: var(--fg-2);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .link-row {
      display: flex;
      align-items: center;
      gap: var(--sp-3);
      flex-wrap: wrap;
    }
    .pill, button.pill {
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.72);
      padding: 10px 14px;
      border-radius: 999px;
      font: inherit;
      color: var(--fg-1);
      text-decoration: none;
      cursor: pointer;
    }
    .pill.active { border-color: var(--accent); color: var(--fg-0); background: rgba(196, 71, 45, 0.12); }
    .hero {
      padding: var(--sp-8) 0 var(--sp-7);
      display: grid;
      gap: var(--sp-5);
    }
    .eyebrow {
      font-family: var(--font-mono);
      font-size: var(--fs-12);
      line-height: var(--lh-12);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--fg-2);
    }
    h1 {
      margin: 0;
      font-size: clamp(42px, 7vw, var(--fs-96));
      line-height: 0.95;
      letter-spacing: -0.05em;
      max-width: 11ch;
    }
    .lead {
      margin: 0;
      max-width: 60ch;
      font-size: var(--fs-20);
      line-height: var(--lh-20);
      color: var(--fg-1);
    }
    .search-panel, .card {
      background: rgba(255,255,255,0.75);
      border: 1px solid rgba(203, 194, 176, 0.8);
      border-radius: 28px;
      box-shadow: var(--shadow);
      backdrop-filter: blur(14px);
    }
    .search-panel {
      padding: var(--sp-5);
      display: grid;
      gap: var(--sp-4);
    }
    input, select {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 14px 16px;
      font: inherit;
      background: white;
      color: var(--fg-0);
    }
    .controls {
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(220px, 1fr);
      gap: var(--sp-4);
    }
    .tag-row {
      display: flex;
      gap: var(--sp-2);
      flex-wrap: wrap;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--sp-5);
      padding: var(--sp-7) 0 var(--sp-9);
    }
    .card {
      padding: var(--sp-5);
      display: grid;
      gap: var(--sp-4);
      align-content: start;
    }
    .card h2, .card h3 { margin: 0; }
    .card p { margin: 0; color: var(--fg-1); }
    .meta {
      display: flex;
      gap: var(--sp-2);
      flex-wrap: wrap;
    }
    .meta span {
      font-family: var(--font-mono);
      font-size: var(--fs-12);
      line-height: var(--lh-12);
      color: var(--fg-2);
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 8px 10px;
      background: var(--bg-0);
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: var(--sp-4);
    }
    .stat {
      padding: var(--sp-4);
      border: 1px solid rgba(203, 194, 176, 0.7);
      border-radius: 20px;
      background: rgba(255,255,255,0.68);
    }
    .stat strong {
      display: block;
      font-size: var(--fs-28);
      line-height: var(--lh-28);
      letter-spacing: -0.04em;
    }
    iframe.preview {
      width: 100%;
      min-height: 760px;
      border: 1px solid rgba(203, 194, 176, 0.8);
      border-radius: 28px;
      background: white;
    }
    .footer {
      padding: var(--sp-7) 0 var(--sp-8);
      color: var(--fg-2);
      font-size: var(--fs-14);
      line-height: var(--lh-14);
      border-top: 1px solid rgba(203, 194, 176, 0.5);
    }
    @media (max-width: 760px) {
      .page { width: min(100% - 24px, 1120px); }
      .controls { grid-template-columns: 1fr; }
      .topbar { align-items: flex-start; flex-direction: column; }
    }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

function renderIndexPage(site) {
  return renderShell({
    title: `${site.title} Catalog`,
    description: site.tagline,
    body: `<div class="page">
  <header class="topbar">
    <a class="brand" href="/">${escapeHtml(site.title)}<span>Cloudflare-ready static catalog</span></a>
    <div class="link-row">
      <a class="pill" href="/manifest/design-systems.json">Manifest</a>
      <a class="pill" href="/llms.txt">llms.txt</a>
    </div>
  </header>
  <section class="hero">
    <div class="eyebrow">Concept-driven systems, human and agent readable</div>
    <h1>Find the right design system quickly.</h1>
    <p class="lead">${escapeHtml(site.tagline)}</p>
    <div class="stats" id="stats"></div>
  </section>
  <section class="search-panel">
    <div class="controls">
      <input id="search" type="search" placeholder="Search by name, concept, inspiration, tag, theme, or summary"/>
      <select id="sort">
        <option value="name">Sort by name</option>
        <option value="updatedAt">Sort by updated date</option>
      </select>
    </div>
    <div>
      <div class="eyebrow">Filter by theme</div>
      <div class="tag-row" id="theme-filters"></div>
    </div>
    <div>
      <div class="eyebrow">Filter by tag</div>
      <div class="tag-row" id="tag-filters"></div>
    </div>
  </section>
  <section class="grid" id="results"></section>
  <footer class="footer">Canonical source lives in the raw single-file HTML documents. The catalog is generated at build time for Cloudflare Pages.</footer>
</div>
<script>
  const state = { systems: [], search: '', sort: 'name', theme: 'all', tag: 'all' };

  function escapeHtml(value) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  function renderStats(systems) {
    const themes = new Set(systems.flatMap((item) => item.themes));
    const tags = new Set(systems.flatMap((item) => item.tags));
    document.querySelector('#stats').innerHTML = [
      ['Systems', systems.length],
      ['Themes', themes.size],
      ['Tags', tags.size]
    ].map(([label, value]) => '<div class="stat"><span class="eyebrow">' + label + '</span><strong>' + value + '</strong></div>').join('');
  }

  function renderFilterButtons(selector, values, selected, key) {
    const host = document.querySelector(selector);
    const buttons = ['all', ...values].map((value) => {
      const label = value === 'all' ? 'All' : value;
      const active = value === selected ? ' active' : '';
      return '<button class="pill' + active + '" data-key="' + key + '" data-value="' + value + '">' + escapeHtml(label) + '</button>';
    });
    host.innerHTML = buttons.join('');
  }

  function sortSystems(items) {
    return [...items].sort((left, right) => {
      if (state.sort === 'updatedAt') {
        return right.updatedAt.localeCompare(left.updatedAt) || left.name.localeCompare(right.name);
      }
      return left.name.localeCompare(right.name);
    });
  }

  function renderResults() {
    const query = state.search.trim().toLowerCase();
    const filtered = state.systems.filter((item) => {
      const matchesQuery = !query || item.searchText.toLowerCase().includes(query);
      const matchesTheme = state.theme === 'all' || item.themes.includes(state.theme);
      const matchesTag = state.tag === 'all' || item.tags.includes(state.tag);
      return matchesQuery && matchesTheme && matchesTag;
    });

    const html = sortSystems(filtered).map((item) => {
      return '<article class="card">' +
        '<div class="eyebrow">' + escapeHtml(item.updatedAt) + '</div>' +
        '<h2>' + escapeHtml(item.name) + '</h2>' +
        '<p>' + escapeHtml(item.summary) + '</p>' +
        '<div class="meta">' + item.tags.map((tag) => '<span>' + escapeHtml(tag) + '</span>').join('') + '</div>' +
        '<div class="meta">' + item.themes.map((theme) => '<span>theme:' + escapeHtml(theme) + '</span>').join('') + '</div>' +
        '<div class="link-row">' +
          '<a class="pill active" href="' + item.urls.detail + '">Catalog detail</a>' +
          '<a class="pill" href="' + item.urls.raw + '">Open raw HTML</a>' +
        '</div>' +
      '</article>';
    }).join('');

    document.querySelector('#results').innerHTML = html || '<article class="card"><h2>No matches</h2><p>Try a broader search term or clear one of the active filters.</p></article>';
  }

  async function boot() {
    const response = await fetch('/manifest/design-systems.min.json');
    const manifest = await response.json();
    state.systems = manifest.systems;
    renderStats(state.systems);

    const themes = [...new Set(state.systems.flatMap((item) => item.themes))].sort();
    const tags = [...new Set(state.systems.flatMap((item) => item.tags))].sort();

    renderFilterButtons('#theme-filters', themes, state.theme, 'theme');
    renderFilterButtons('#tag-filters', tags, state.tag, 'tag');
    renderResults();

    document.querySelector('#search').addEventListener('input', (event) => {
      state.search = event.target.value;
      renderResults();
    });

    document.querySelector('#sort').addEventListener('change', (event) => {
      state.sort = event.target.value;
      renderResults();
    });

    document.body.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-key]');
      if (!button) return;
      state[button.dataset.key] = button.dataset.value;
      renderFilterButtons('#theme-filters', themes, state.theme, 'theme');
      renderFilterButtons('#tag-filters', tags, state.tag, 'tag');
      renderResults();
    });
  }

  boot();
</script>`
  });
}

function renderDetailPage(system, site) {
  return renderShell({
    title: `${system.name} | ${site.title}`,
    description: system.summary,
    body: `<div class="page">
  <header class="topbar">
    <a class="brand" href="/">${escapeHtml(site.title)}<span>Catalog detail</span></a>
    <div class="link-row">
      <a class="pill" href="/manifest/design-systems.json">Manifest</a>
      <a class="pill active" href="${system.urls.raw}">Open raw HTML</a>
    </div>
  </header>
  <section class="hero">
    <div class="eyebrow">${escapeHtml(system.concept)}</div>
    <h1>${escapeHtml(system.name)}</h1>
    <p class="lead">${escapeHtml(system.summary)}</p>
    <div class="meta">
      ${system.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
      ${system.themes.map((theme) => `<span>theme:${escapeHtml(theme)}</span>`).join('')}
      <span>${escapeHtml(system.updatedAt)}</span>
    </div>
  </section>
  <section class="grid" style="grid-template-columns: minmax(0, 1fr); padding-top: 0;">
    <article class="card">
      <h2>Machine-readable facts</h2>
      <p>${escapeHtml(system.inspiration)}</p>
      <div class="stats">
        <div class="stat"><span class="eyebrow">Slug</span><strong>${escapeHtml(system.slug)}</strong></div>
        <div class="stat"><span class="eyebrow">Status</span><strong>${escapeHtml(system.status)}</strong></div>
        <div class="stat"><span class="eyebrow">Version</span><strong>${escapeHtml(system.version)}</strong></div>
      </div>
      <div class="link-row">
        <a class="pill active" href="${system.urls.raw}">Canonical HTML</a>
        <a class="pill" href="/">Back to catalog</a>
      </div>
    </article>
    <iframe class="preview" src="${system.urls.raw}" title="${escapeHtml(system.name)} preview"></iframe>
  </section>
  <footer class="footer">This detail wrapper is generated at build time. The raw HTML remains the canonical artifact.</footer>
</div>`
  });
}

function renderLlms(manifest) {
  const lines = [
    '# ' + manifest.site.title,
    '',
    '> Static catalog for concept-driven single-file HTML design systems.',
    '',
    'Primary machine-readable endpoints:',
    '- /manifest/design-systems.json',
    '- /manifest/design-systems.min.json',
    '- /sitemap.xml',
    '',
    'Canonical documents:',
    ...manifest.systems.map((system) => `- ${system.name}: ${system.urls.raw}`),
    '',
    'Detail wrappers:',
    ...manifest.systems.map((system) => `- ${system.name}: ${system.urls.detail}`)
  ];
  return lines.join('\n') + '\n';
}

function renderSitemap(manifest) {
  const urls = ['/', '/llms.txt', '/manifest/design-systems.json', '/manifest/design-systems.min.json', ...manifest.systems.flatMap((system) => [system.urls.detail, system.urls.raw])];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${manifest.site.origin}${url}</loc></url>`).join('\n')}
</urlset>
`;
}

function buildManifestEntry(record) {
  return {
    ...record.metadata,
    sections: record.sections,
    urls: {
      detail: `/systems/${record.metadata.slug}/`,
      raw: `/raw/${record.metadata.source.file}`
    }
  };
}

function buildMinEntry(entry) {
  return {
    id: entry.id,
    slug: entry.slug,
    name: entry.name,
    title: entry.title,
    concept: entry.concept,
    inspiration: entry.inspiration,
    summary: entry.summary,
    tags: entry.tags,
    themes: entry.themes,
    status: entry.status,
    version: entry.version,
    updatedAt: entry.updatedAt,
    searchText: entry.searchText,
    urls: entry.urls
  };
}

export async function buildCatalog({ rootDir, outDir, site }) {
  const files = await collectDesignSystemFiles(rootDir);
  const records = await Promise.all(files.map((filePath) => validateDesignSystemFile(filePath, rootDir)));
  const systems = records.map(buildManifestEntry).sort((left, right) => left.name.localeCompare(right.name));

  const seenIds = new Set();
  const seenSlugs = new Set();
  for (const system of systems) {
    if (seenIds.has(system.id)) throw new Error(`Duplicate system id "${system.id}"`);
    if (seenSlugs.has(system.slug)) throw new Error(`Duplicate system slug "${system.slug}"`);
    seenIds.add(system.id);
    seenSlugs.add(system.slug);
  }

  const manifest = {
    site,
    generatedAt: new Date().toISOString(),
    systemCount: systems.length,
    systems
  };

  await rm(outDir, { recursive: true, force: true });
  await mkdir(path.join(outDir, 'manifest'), { recursive: true });
  await mkdir(path.join(outDir, 'raw'), { recursive: true });
  await mkdir(path.join(outDir, 'systems'), { recursive: true });

  await writeFile(path.join(outDir, 'index.html'), renderIndexPage(site), 'utf8');
  await writeFile(path.join(outDir, 'manifest', 'design-systems.json'), JSON.stringify(manifest, null, 2), 'utf8');
  await writeFile(path.join(outDir, 'manifest', 'design-systems.min.json'), JSON.stringify({
    site: manifest.site,
    generatedAt: manifest.generatedAt,
    systemCount: manifest.systemCount,
    systems: manifest.systems.map(buildMinEntry)
  }, null, 2), 'utf8');
  await writeFile(path.join(outDir, 'llms.txt'), renderLlms(manifest), 'utf8');
  await writeFile(path.join(outDir, 'sitemap.xml'), renderSitemap(manifest), 'utf8');

  for (const system of systems) {
    const sourcePath = path.join(rootDir, system.source.repoPath);
    const detailDir = path.join(outDir, 'systems', system.slug);
    await mkdir(detailDir, { recursive: true });
    await copyFile(sourcePath, path.join(outDir, 'raw', system.source.file));
    await writeFile(path.join(detailDir, 'index.html'), renderDetailPage(system, site), 'utf8');
  }

  return manifest;
}
