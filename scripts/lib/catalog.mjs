import path from 'node:path';
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';

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
  'sections',
  'source',
  'updatedAt'
];

export async function collectMetadataFiles(rootDir) {
  const metadataDir = path.join(rootDir, 'catalog', 'metadata');
  const entries = await readdir(metadataDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(metadataDir, entry.name))
    .sort();
}

export function extractHtmlIds(html) {
  const ids = new Set();
  const pattern = /\sid="([^"]+)"/gi;
  let match = pattern.exec(html);
  while (match) {
    ids.add(match[1]);
    match = pattern.exec(html);
  }
  return ids;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
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

function validateSections(metadata, htmlIds) {
  if (!Array.isArray(metadata.sections) || metadata.sections.length === 0) {
    throw new Error('Metadata "sections" must be a non-empty array');
  }

  for (const section of metadata.sections) {
    if (!section || typeof section !== 'object') {
      throw new Error('Each metadata section must be an object');
    }
    if (typeof section.id !== 'string' || section.id.trim() === '') {
      throw new Error('Each metadata section requires an "id"');
    }
    if (typeof section.label !== 'string' || section.label.trim() === '') {
      throw new Error(`Section "${section.id}" requires a "label"`);
    }
    if (!htmlIds.has(section.id)) {
      throw new Error(`Declared section id "${section.id}" was not found in source HTML`);
    }
  }
}

function validateMetadata(metadata, htmlFilePath, metadataPath, rootDir) {
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

  const expectedFile = path.basename(htmlFilePath);
  if (metadata.source.file !== expectedFile) {
    throw new Error(`Metadata source.file "${metadata.source.file}" must match filename "${expectedFile}"`);
  }

  const expectedRepoPath = path.relative(rootDir, htmlFilePath).split(path.sep).join('/');
  if (metadata.source.repoPath !== expectedRepoPath) {
    throw new Error(`Metadata source.repoPath "${metadata.source.repoPath}" must match repo path "${expectedRepoPath}"`);
  }

  const expectedMetadataRepoPath = path.relative(rootDir, metadataPath).split(path.sep).join('/');
  if (metadata.metadataPath && metadata.metadataPath !== expectedMetadataRepoPath) {
    throw new Error(`Metadata metadataPath "${metadata.metadataPath}" must match repo path "${expectedMetadataRepoPath}"`);
  }
}

export async function validateDesignSystemEntry(metadataPath, rootDir = process.cwd()) {
  const metadata = await readJson(metadataPath);
  const htmlFilePath = path.join(rootDir, metadata.source.repoPath);
  const html = await readFile(htmlFilePath, 'utf8');
  const htmlIds = extractHtmlIds(html);

  validateMetadata(metadata, htmlFilePath, metadataPath, rootDir);
  validateSections(metadata, htmlIds);

  return {
    metadataPath,
    htmlFilePath,
    html,
    htmlIds: [...htmlIds],
    metadata
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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --green: #006941;
      --green-dim: #005c38;
      --green-soft: #7bfeb8;
      --zinc-50: #fafafa;
      --zinc-100: #f4f4f5;
      --zinc-200: #e4e4e7;
      --zinc-300: #d4d4d8;
      --zinc-400: #a1a1aa;
      --zinc-500: #71717a;
      --zinc-600: #52525b;
      --zinc-700: #3f3f46;
      --zinc-800: #27272a;
      --zinc-900: #18181b;
      --zinc-950: #09090b;
      --white: #ffffff;
      --accent: var(--green);
      --accent-dim: var(--green-dim);
      --accent-soft: var(--green-soft);
      --fg-0: #2d2f2f;
      --fg-1: #5a5c5c;
      --fg-2: #9a9c9c;
      --fg-inv: var(--white);
      --bg-0: #f6f6f6;
      --bg-1: var(--white);
      --bg-2: #f0f1f1;
      --line: var(--zinc-200);
      --line-strong: var(--zinc-400);
      --font-headline: "Inter", "Helvetica Neue", Arial, sans-serif;
      --font-body: "Inter", "Helvetica Neue", Arial, sans-serif;
      --font-label: "Space Grotesk", "Helvetica Neue", Arial, sans-serif;
      --font-mono: ui-monospace, Menlo, Monaco, Consolas, monospace;
      --fs-12: 12px; --lh-12: 16px;
      --fs-14: 14px; --lh-14: 20px;
      --fs-16: 16px; --lh-16: 24px;
      --fs-18: 18px; --lh-18: 28px;
      --fs-20: 20px; --lh-20: 28px;
      --fs-24: 24px; --lh-24: 32px;
      --fs-36: 36px; --lh-36: 40px;
      --fs-48: 48px; --lh-48: 48px;
      --fs-60: 60px; --lh-60: 60px;
      --fs-96: 96px; --lh-96: 88px;
      --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-5: 20px;
      --sp-6: 24px; --sp-7: 32px; --sp-8: 40px; --sp-9: 48px; --sp-10: 64px;
      --r-0: 0; --r-1: 4px; --r-2: 8px; --r-full: 9999px;
      --shadow-lift: 0 1px 2px rgba(45,47,47,.04), 0 4px 12px -4px rgba(45,47,47,.08);
      --shadow-card: 0 20px 40px rgba(45,47,47,.06);
      --shadow-focus: 0 0 0 3px rgba(0,105,65,.18);
      --ease-std: cubic-bezier(0.4, 0, 0.2, 1);
      --ease-decel: cubic-bezier(0, 0, 0.2, 1);
      --dur-fast: 100ms; --dur-base: 150ms; --dur-slow: 300ms; --dur-glide: 500ms;
      --signal-suzuka: #006941;
      --signal-edge: #E62020;
      --signal-playtime: #3AA7FF;
    }
    [data-theme="night"] {
      --fg-0: var(--white);
      --fg-1: var(--zinc-400);
      --fg-2: var(--zinc-600);
      --fg-inv: var(--zinc-950);
      --bg-0: var(--zinc-950);
      --bg-1: var(--zinc-900);
      --bg-2: var(--zinc-800);
      --line: var(--zinc-700);
      --line-strong: var(--zinc-500);
      --shadow-lift: 0 1px 2px rgba(0,0,0,.3), 0 4px 12px -4px rgba(0,0,0,.5);
      --shadow-card: 0 20px 40px rgba(0,0,0,.3);
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: var(--font-body);
      color: var(--fg-0);
      background: var(--bg-0);
      transition: background var(--dur-slow) var(--ease-std), color var(--dur-slow) var(--ease-std);
    }
    a { color: inherit; text-decoration: none; }
    button, input, select { font: inherit; color: inherit; }
    .page { width: min(1120px, calc(100% - 48px)); margin: 0 auto; }
    .navbar {
      display: flex;
      align-items: center;
      gap: var(--sp-4);
      height: 60px;
      border-bottom: 1px solid var(--line);
      background: color-mix(in srgb, var(--bg-0) 86%, transparent);
      backdrop-filter: blur(16px);
      position: sticky;
      top: 0;
      z-index: 40;
      transition: background var(--dur-slow) var(--ease-std), border-color var(--dur-slow) var(--ease-std);
    }
    .navbar .page {
      display: flex;
      align-items: center;
      gap: var(--sp-4);
      width: min(1120px, calc(100% - 48px));
      height: 100%;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: var(--sp-3);
      font-family: var(--font-label);
      font-size: var(--fs-14);
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--fg-0);
      flex-shrink: 0;
    }
    .brand-mark { display: inline-flex; align-items: center; gap: 3px; height: 14px; }
    .brand-mark span {
      display: block;
      height: 14px;
      border-radius: 1px;
      background: var(--accent);
      transition: width var(--dur-base) var(--ease-std), transform var(--dur-slow) var(--ease-decel);
    }
    .brand-mark span:nth-child(1) { width: 2px; }
    .brand-mark span:nth-child(2) { width: 6px; }
    .brand-mark span:nth-child(3) { width: 3px; }
    .brand:hover .brand-mark span:nth-child(1) { width: 4px; }
    .brand:hover .brand-mark span:nth-child(2) { width: 10px; }
    .brand:hover .brand-mark span:nth-child(3) { width: 5px; }
    .nav-spacer { flex: 1; }
    .nav-links { display: flex; align-items: center; gap: var(--sp-1); flex-wrap: wrap; }
    .nav-link {
      display: inline-flex;
      align-items: center;
      height: 36px;
      padding: 0 var(--sp-3);
      font-family: var(--font-label);
      font-size: var(--fs-12);
      font-weight: 500;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--fg-2);
      border: 0;
      background: transparent;
      cursor: pointer;
      position: relative;
      transition: color var(--dur-base) var(--ease-std);
    }
    .nav-link::after {
      content: "";
      position: absolute;
      left: var(--sp-3);
      right: var(--sp-3);
      bottom: 0;
      height: 2px;
      background: var(--accent);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform var(--dur-base) var(--ease-std);
    }
    .nav-link:hover { color: var(--fg-0); }
    .nav-link:hover::after, .nav-link.active::after { transform: scaleX(1); }
    .nav-link.active { color: var(--fg-0); font-weight: 700; }
    .theme-toggle {
      display: inline-flex;
      align-items: center;
      gap: var(--sp-2);
      height: 36px;
      padding: 0 var(--sp-3);
      background: var(--bg-1);
      border: 1px solid var(--line);
      border-radius: var(--r-1);
      cursor: pointer;
      font-family: var(--font-label);
      font-size: var(--fs-12);
      font-weight: 500;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--fg-1);
      transition: all var(--dur-base) var(--ease-std);
    }
    .theme-toggle:hover {
      background: var(--bg-2);
      border-color: var(--accent);
      color: var(--fg-0);
    }
    .hero {
      position: relative;
      overflow: hidden;
      border-bottom: 1px solid var(--line);
    }
    .hero-visual {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        repeating-linear-gradient(90deg, transparent 0 47px, rgba(0,105,65,0.06) 47px 48px),
        repeating-linear-gradient(0deg, transparent 0 47px, rgba(45,47,47,0.04) 47px 48px),
        linear-gradient(180deg, var(--bg-0) 0%, var(--bg-2) 100%);
    }
    [data-theme="night"] .hero-visual {
      background:
        repeating-linear-gradient(90deg, transparent 0 47px, rgba(123,254,184,0.06) 47px 48px),
        repeating-linear-gradient(0deg, transparent 0 47px, rgba(255,255,255,0.03) 47px 48px),
        linear-gradient(180deg, var(--bg-0) 0%, var(--bg-1) 100%);
    }
    .hero-inner {
      position: relative;
      z-index: 1;
      width: min(1120px, calc(100% - 48px));
      margin: 0 auto;
      padding: clamp(48px, 8vh, 88px) 0 clamp(56px, 9vh, 96px);
      display: grid;
      gap: var(--sp-6);
      animation: rise-in var(--dur-glide) var(--ease-decel) both;
    }
    .hero-copy {
      display: grid;
      gap: var(--sp-5);
      max-width: 40rem;
    }
    .hero-rule {
      display: flex;
      align-items: flex-end;
      gap: var(--sp-3);
      width: min(100%, 520px);
      padding-bottom: 6px;
    }
    .hero-rule span {
      display: block;
      height: 14px;
      border-radius: 1px;
      background: var(--accent);
    }
    .hero-rule span:nth-child(1) { width: 3px; }
    .hero-rule span:nth-child(2) { width: 10px; }
    .hero-rule span:nth-child(3) { width: 5px; }
    .hero-rule::after {
      content: "";
      flex: 1;
      height: 1px;
      background: var(--accent);
      opacity: 0.35;
      transform: scaleX(0);
      transform-origin: left;
      animation: speed-draw 0.9s var(--ease-decel) 0.45s forwards;
    }
    @keyframes speed-draw {
      to { transform: scaleX(1); }
    }
    @keyframes rise-in {
      from { opacity: 0; transform: translateY(14px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .eyebrow {
      font-family: var(--font-label);
      font-size: var(--fs-12);
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--accent);
      margin: 0;
    }
    .hero h1 {
      margin: 0;
      font-family: var(--font-headline);
      font-size: clamp(48px, 7vw, 80px);
      line-height: 0.94;
      font-weight: 800;
      letter-spacing: -0.045em;
      color: var(--fg-0);
      max-width: 12ch;
    }
    .lead {
      margin: 0;
      max-width: 40ch;
      font-size: var(--fs-18);
      line-height: 1.55;
      color: var(--fg-1);
    }
    .cta-row { display: flex; flex-wrap: wrap; gap: var(--sp-3); }
    .btn {
      font-family: var(--font-label);
      font-weight: 700;
      font-size: var(--fs-14);
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 10px var(--sp-5);
      border: none;
      border-radius: var(--r-1);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: var(--sp-2);
      transition: all var(--dur-base) var(--ease-std);
      text-decoration: none;
    }
    .btn:active { transform: scale(0.97); transition-duration: var(--dur-fast); }
    .btn-primary { background: var(--accent); color: var(--fg-inv); }
    .btn-primary:hover { background: var(--accent-dim); }
    .btn-ghost {
      background: transparent;
      color: var(--accent);
      border: 1.5px solid var(--accent);
      padding: 9px var(--sp-5);
    }
    .btn-ghost:hover { background: rgba(0,105,65,.08); }
    .btn-surface {
      background: var(--bg-1);
      color: var(--fg-0);
      border: 1px solid var(--line);
      padding: 9px var(--sp-5);
    }
    .btn-surface:hover {
      background: var(--bg-2);
      border-color: var(--line-strong);
    }
    .section {
      padding: var(--sp-10) 0;
    }
    .section-head {
      display: grid;
      gap: var(--sp-3);
      margin-bottom: var(--sp-7);
      max-width: 52ch;
    }
    .section-head h2 {
      margin: 0;
      font-family: var(--font-headline);
      font-size: var(--fs-36);
      line-height: var(--lh-36);
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .section-head p {
      margin: 0;
      color: var(--fg-1);
      font-size: var(--fs-16);
      line-height: 1.6;
    }
    .controls {
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(200px, 1fr);
      gap: var(--sp-4);
      margin-bottom: var(--sp-5);
    }
    .input, .select {
      width: 100%;
      font-family: var(--font-body);
      font-size: var(--fs-16);
      color: var(--fg-0);
      background: var(--bg-1);
      border: 1.5px solid var(--line);
      border-radius: var(--r-1);
      padding: 10px var(--sp-4);
      outline: none;
      transition: border-color var(--dur-base) var(--ease-std), box-shadow var(--dur-base) var(--ease-std);
    }
    .input::placeholder { color: var(--fg-2); }
    .input:focus, .select:focus {
      border-color: var(--accent);
      box-shadow: var(--shadow-focus);
    }
    .filter-block { display: grid; gap: var(--sp-2); margin-bottom: var(--sp-4); }
    .filter-label {
      font-family: var(--font-label);
      font-size: var(--fs-12);
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--fg-2);
    }
    .chip-row { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: var(--sp-2);
      padding: 6px var(--sp-3);
      border-radius: var(--r-1);
      border: 1px solid var(--line);
      background: var(--bg-1);
      font-family: var(--font-label);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--fg-1);
      cursor: pointer;
      transition: all var(--dur-base) var(--ease-std);
    }
    .chip:hover { border-color: var(--line-strong); color: var(--fg-0); }
    .chip.active {
      background: var(--accent);
      border-color: var(--accent);
      color: var(--fg-inv);
    }
    .results-meta {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: var(--sp-4);
      padding: var(--sp-4) 0;
      border-top: 1px solid var(--line);
      margin-top: var(--sp-4);
    }
    .results-count {
      font-family: var(--font-headline);
      font-size: var(--fs-24);
      font-weight: 700;
      letter-spacing: -0.03em;
    }
    .results-note {
      margin: 0;
      max-width: 42ch;
      color: var(--fg-2);
      font-size: var(--fs-14);
      line-height: var(--lh-14);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--sp-5);
      padding: var(--sp-5) 0 var(--sp-9);
    }
    .card {
      position: relative;
      display: grid;
      gap: var(--sp-4);
      align-content: start;
      min-height: 280px;
      padding: var(--sp-6);
      background: var(--bg-1);
      border: 1px solid var(--line);
      border-radius: var(--r-2);
      box-shadow: var(--shadow-card);
      overflow: hidden;
      transition: box-shadow var(--dur-base) var(--ease-std), border-color var(--dur-base) var(--ease-std), transform var(--dur-slow) var(--ease-decel);
      animation: rise-in var(--dur-glide) var(--ease-decel) both;
    }
    .card:hover {
      box-shadow: var(--shadow-lift);
      border-color: var(--line-strong);
      transform: translateY(-2px);
    }
    .card::before {
      content: "";
      position: absolute;
      inset: 0 auto 0 0;
      width: 4px;
      background: var(--card-signal, var(--accent));
    }
    .card[data-slug="suzuka"] { --card-signal: var(--signal-suzuka); }
    .card[data-slug="edge-runner"] { --card-signal: var(--signal-edge); }
    .card[data-slug="playtime"] { --card-signal: var(--signal-playtime); }
    .card h3 {
      margin: 0;
      font-family: var(--font-headline);
      font-size: var(--fs-24);
      line-height: 1.1;
      letter-spacing: -0.03em;
    }
    .card p {
      margin: 0;
      color: var(--fg-1);
      font-size: var(--fs-14);
      line-height: 1.6;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sp-2);
    }
    .meta span {
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 0.04em;
      color: var(--fg-2);
      text-transform: uppercase;
    }
    .card-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sp-2);
      margin-top: auto;
    }
    .empty-state {
      grid-column: 1 / -1;
      padding: var(--sp-8);
      border: 1px dashed var(--line);
      background: var(--bg-1);
      display: grid;
      gap: var(--sp-3);
    }
    .empty-state h3 { margin: 0; font-size: var(--fs-24); letter-spacing: -0.03em; }
    .empty-state p { margin: 0; color: var(--fg-1); }
    .detail-hero {
      padding: var(--sp-9) 0 var(--sp-7);
      display: grid;
      gap: var(--sp-4);
      border-bottom: 1px solid var(--line);
    }
    .detail-hero h1 {
      margin: 0;
      font-family: var(--font-headline);
      font-size: clamp(42px, 8vw, var(--fs-60));
      line-height: 0.95;
      letter-spacing: -0.04em;
      font-weight: 800;
    }
    .preview-frame {
      width: 100%;
      min-height: 760px;
      border: 1px solid var(--line);
      border-radius: var(--r-2);
      background: var(--bg-1);
      margin: var(--sp-7) 0;
    }
    .facts {
      display: grid;
      gap: var(--sp-4);
      padding: var(--sp-6);
      background: var(--bg-1);
      border: 1px solid var(--line);
      border-radius: var(--r-2);
      border-left: 4px solid var(--accent);
    }
    .facts h2 {
      margin: 0;
      font-family: var(--font-headline);
      font-size: var(--fs-20);
      letter-spacing: -0.02em;
    }
    .facts p { margin: 0; color: var(--fg-1); line-height: 1.6; }
    .footer {
      padding: var(--sp-8) 0;
      border-top: 1px solid var(--line);
      color: var(--fg-2);
      font-size: var(--fs-14);
      line-height: var(--lh-14);
    }
    @media (max-width: 760px) {
      .page { width: min(100% - 24px, 1120px); }
      .navbar .page { width: min(100% - 24px, 1120px); }
      .hero-inner { width: min(100% - 24px, 1120px); padding: var(--sp-7) 0 var(--sp-8); }
      .controls { grid-template-columns: 1fr; }
      .results-meta { flex-direction: column; }
      .nav-links { display: none; }
    }
  </style>
</head>
<body>${body}
<script>
  (function () {
    const root = document.documentElement;
    const saved = localStorage.getItem('catalogTheme');
    if (saved === 'night' || saved === 'day') root.setAttribute('data-theme', saved);
    const toggle = document.querySelector('#themeToggle');
    if (!toggle) return;
    const sync = () => {
      const theme = root.getAttribute('data-theme') === 'night' ? 'night' : 'day';
      toggle.textContent = theme === 'night' ? 'Day' : 'Night';
      toggle.setAttribute('aria-label', 'Switch to ' + (theme === 'night' ? 'day' : 'night') + ' theme');
    };
    sync();
    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'night' ? 'day' : 'night';
      root.setAttribute('data-theme', next);
      localStorage.setItem('catalogTheme', next);
      sync();
    });
  })();
</script>
</body>
</html>`;
}

function renderIndexPage(site) {
  const repo = site.repository || 'https://github.com/ZUENS2020/Design-Systems';
  return renderShell({
    title: `${site.title}`,
    description: site.tagline,
    body: `
<header class="navbar">
  <div class="page">
    <a class="brand" href="/">
      <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
      Design Systems
    </a>
    <div class="nav-spacer"></div>
    <nav class="nav-links" aria-label="Catalog">
      <a class="nav-link active" href="#catalog">Catalog</a>
      <a class="nav-link" href="/manifest/design-systems.json">Manifest</a>
      <a class="nav-link" href="/llms.txt">llms.txt</a>
      <a class="nav-link" href="${escapeHtml(repo)}" rel="noreferrer">GitHub</a>
    </nav>
    <button class="theme-toggle" id="themeToggle" type="button">Night</button>
  </div>
</header>
<section class="hero">
  <div class="hero-visual" aria-hidden="true"></div>
  <div class="hero-inner">
    <div class="hero-copy">
      <p class="eyebrow">Suzuka shell · concept catalog</p>
      <h1>Design Systems</h1>
      <p class="lead">${escapeHtml(site.tagline)}</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="#catalog">Browse catalog</a>
        <a class="btn btn-ghost" href="/raw/Suzuka_Design_System.html">Open Suzuka</a>
      </div>
    </div>
    <div class="hero-rule" aria-hidden="true"><span></span><span></span><span></span></div>
  </div>
</section>
<section class="section page" id="catalog">
  <div class="section-head">
    <p class="eyebrow">Directory</p>
    <h2>Three systems. Untouched HTML.</h2>
    <p>Browse by theme and tag. Each entry routes to a catalog wrapper and the canonical single-file document copied through unchanged.</p>
  </div>
  <div class="controls">
    <input class="input" id="search" type="search" placeholder="Search name, concept, inspiration, tag, theme…"/>
    <select class="select" id="sort">
      <option value="name">Sort by name</option>
      <option value="updatedAt">Sort by updated date</option>
    </select>
  </div>
  <div class="filter-block">
    <div class="filter-label">Theme</div>
    <div class="chip-row" id="theme-filters"></div>
  </div>
  <div class="filter-block">
    <div class="filter-label">Tag</div>
    <div class="chip-row" id="tag-filters"></div>
  </div>
  <div class="results-meta">
    <div class="results-count" id="results-count">0 systems</div>
    <p class="results-note">Metadata lives in sidecar JSON. Canonical HTML is never rewritten by the catalog.</p>
  </div>
  <div class="grid" id="results"></div>
</section>
<footer class="footer page">Generated from sidecar metadata. Canonical design system HTML files are copied through unchanged.</footer>
<script>
  const state = { systems: [], search: '', sort: 'name', theme: 'all', tag: 'all' };
  const esc = (value) => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  function renderButtons(selector, values, selected, key) {
    document.querySelector(selector).innerHTML = ['all', ...values].map((value) => {
      const active = value === selected ? ' active' : '';
      const label = value === 'all' ? 'All' : value;
      return '<button class="chip' + active + '" type="button" data-key="' + key + '" data-value="' + esc(value) + '">' + esc(label) + '</button>';
    }).join('');
  }
  function sorted(items) {
    return [...items].sort((a, b) => state.sort === 'updatedAt'
      ? b.updatedAt.localeCompare(a.updatedAt) || a.name.localeCompare(b.name)
      : a.name.localeCompare(b.name));
  }
  function renderResults() {
    const query = state.search.trim().toLowerCase();
    const filtered = state.systems.filter((item) => {
      const matchesQuery = !query || item.searchText.toLowerCase().includes(query);
      const matchesTheme = state.theme === 'all' || item.themes.includes(state.theme);
      const matchesTag = state.tag === 'all' || item.tags.includes(state.tag);
      return matchesQuery && matchesTheme && matchesTag;
    });
    document.querySelector('#results-count').textContent = filtered.length + (filtered.length === 1 ? ' system' : ' systems');
    document.querySelector('#results').innerHTML = sorted(filtered).map((item, index) => (
      '<article class="card" data-slug="' + esc(item.slug) + '" style="animation-delay:' + (index * 60) + 'ms">' +
      '<p class="eyebrow">' + esc(item.updatedAt) + ' · v' + esc(item.version) + '</p>' +
      '<h3>' + esc(item.name) + '</h3>' +
      '<p>' + esc(item.summary) + '</p>' +
      '<div class="meta">' + item.tags.map((tag) => '<span>' + esc(tag) + '</span>').join('') + '</div>' +
      '<div class="meta">' + item.themes.map((theme) => '<span>theme:' + esc(theme) + '</span>').join('') + '</div>' +
      '<div class="card-actions">' +
      '<a class="btn btn-primary" href="' + item.urls.detail + '">Catalog detail</a>' +
      '<a class="btn btn-surface" href="' + item.urls.raw + '">Raw HTML</a>' +
      '</div></article>'
    )).join('') || '<article class="empty-state"><p class="eyebrow">No route</p><h3>No matches</h3><p>Try a broader term or clear one of the active filters.</p></article>';
  }
  async function boot() {
    const manifest = await fetch('/manifest/design-systems.min.json').then((response) => response.json());
    state.systems = manifest.systems;
    const themes = [...new Set(state.systems.flatMap((item) => item.themes))].sort();
    const tags = [...new Set(state.systems.flatMap((item) => item.tags))].sort();
    renderButtons('#theme-filters', themes, state.theme, 'theme');
    renderButtons('#tag-filters', tags, state.tag, 'tag');
    renderResults();
    document.querySelector('#search').addEventListener('input', (event) => { state.search = event.target.value; renderResults(); });
    document.querySelector('#sort').addEventListener('change', (event) => { state.sort = event.target.value; renderResults(); });
    document.body.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-key]');
      if (!button) return;
      state[button.dataset.key] = button.dataset.value;
      renderButtons('#theme-filters', themes, state.theme, 'theme');
      renderButtons('#tag-filters', tags, state.tag, 'tag');
      renderResults();
    });
  }
  boot();
</script>`
  });
}

function renderDetailPage(system, site) {
  const repo = site.repository || 'https://github.com/ZUENS2020/Design-Systems';
  return renderShell({
    title: `${system.name} | ${site.title}`,
    description: system.summary,
    body: `
<header class="navbar">
  <div class="page">
    <a class="brand" href="/">
      <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
      Design Systems
    </a>
    <div class="nav-spacer"></div>
    <nav class="nav-links" aria-label="Catalog">
      <a class="nav-link" href="/">Catalog</a>
      <a class="nav-link" href="/manifest/design-systems.json">Manifest</a>
      <a class="nav-link active" href="${system.urls.raw}">Raw HTML</a>
      <a class="nav-link" href="${escapeHtml(repo)}" rel="noreferrer">GitHub</a>
    </nav>
    <button class="theme-toggle" id="themeToggle" type="button">Night</button>
  </div>
</header>
<section class="page detail-hero">
  <p class="eyebrow">${escapeHtml(system.concept)}</p>
  <h1>${escapeHtml(system.name)}</h1>
  <p class="lead">${escapeHtml(system.summary)}</p>
  <div class="meta">
    ${system.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
    ${system.themes.map((theme) => `<span>theme:${escapeHtml(theme)}</span>`).join('')}
    <span>${escapeHtml(system.updatedAt)}</span>
  </div>
  <div class="cta-row">
    <a class="btn btn-primary" href="${system.urls.raw}">Open canonical HTML</a>
    <a class="btn btn-surface" href="/">Back to catalog</a>
  </div>
</section>
<section class="page">
  <article class="facts">
    <h2>Machine-readable facts</h2>
    <p>${escapeHtml(system.inspiration)}</p>
    <div class="meta">${system.sections.map((section) => `<span>${escapeHtml(section.label)}</span>`).join('')}</div>
  </article>
  <iframe class="preview-frame" src="${system.urls.raw}" title="${escapeHtml(system.name)} preview"></iframe>
</section>
<footer class="footer page">This wrapper is generated from sidecar metadata. The design system HTML is untouched.</footer>`
  });
}

function renderLlms(manifest) {
  return [
    '# ' + manifest.site.title,
    '',
    '> Static catalog for concept-driven single-file HTML design systems.',
    '',
    'Metadata source:',
    '- /manifest/design-systems.json',
    '- /manifest/design-systems.min.json',
    '- /sitemap.xml',
    '',
    'Canonical HTML documents:',
    ...manifest.systems.map((system) => `- ${system.name}: ${system.urls.raw}`),
    '',
    'Catalog detail pages:',
    ...manifest.systems.map((system) => `- ${system.name}: ${system.urls.detail}`)
  ].join('\n') + '\n';
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
    sections: entry.sections,
    urls: entry.urls
  };
}

export async function buildCatalog({ rootDir, outDir, site }) {
  const metadataFiles = await collectMetadataFiles(rootDir);
  const records = await Promise.all(metadataFiles.map((metadataPath) => validateDesignSystemEntry(metadataPath, rootDir)));
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

  for (const record of records) {
    const system = buildManifestEntry(record);
    const detailDir = path.join(outDir, 'systems', system.slug);
    await mkdir(detailDir, { recursive: true });
    await copyFile(record.htmlFilePath, path.join(outDir, 'raw', system.source.file));
    await writeFile(path.join(detailDir, 'index.html'), renderDetailPage(system, site), 'utf8');
  }

  return manifest;
}
