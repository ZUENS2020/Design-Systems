import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { buildCatalog, validateDesignSystemEntry } from '../scripts/lib/catalog.mjs';

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'foundations', label: 'Foundations' },
  { id: 'components', label: 'Components' },
  { id: 'motion', label: 'Motion' },
  { id: 'iconography', label: 'Iconography' },
  { id: 'copy', label: 'Voice & Tone' }
];

function makeHtml(summary = 'A compact summary for indexing.') {
  return `<!DOCTYPE html>
<html lang="en" data-theme="night">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Test System Design System</title>
</head>
<body>
  <nav>${sections.map((section) => `<a href="#${section.id}">${section.label}</a>`).join('')}</nav>
  <main>${sections.map((section) => `<div id="${section.id}"><h2>${section.label}</h2><p>${summary}</p></div>`).join('')}</main>
</body>
</html>`;
}

function makeMetadata({
  slug = 'test-system',
  name = 'Test System',
  title = 'Test System Design System',
  file = 'Test_System_Design_System.html',
  repoPath = 'design-systems/Test_System_Design_System.html',
  metadataPath = 'catalog/metadata/test-system.json'
} = {}) {
  return {
    id: slug,
    slug,
    name,
    title,
    concept: 'A cinematic system.',
    inspiration: 'A film reference.',
    summary: 'A compact summary for indexing.',
    tags: ['cinematic', 'test'],
    themes: ['night'],
    locale: 'en',
    status: 'stable',
    version: '1.0.0',
    searchText: `${name} cinematic test summary`,
    sections,
    source: {
      file,
      repoPath
    },
    metadataPath,
    updatedAt: '2026-04-29'
  };
}

async function setupFixture() {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'design-systems-'));
  await mkdir(path.join(tempDir, 'design-systems'), { recursive: true });
  await mkdir(path.join(tempDir, 'catalog', 'metadata'), { recursive: true });
  return tempDir;
}

test('validateDesignSystemEntry accepts valid sidecar metadata and unchanged html', async () => {
  const tempDir = await setupFixture();
  const htmlPath = path.join(tempDir, 'design-systems', 'Test_System_Design_System.html');
  const metadataPath = path.join(tempDir, 'catalog', 'metadata', 'test-system.json');

  await writeFile(htmlPath, makeHtml(), 'utf8');
  await writeFile(metadataPath, JSON.stringify(makeMetadata(), null, 2), 'utf8');

  const result = await validateDesignSystemEntry(metadataPath, tempDir);

  assert.equal(result.metadata.slug, 'test-system');
  assert.equal(result.htmlFilePath, htmlPath);

  await rm(tempDir, { recursive: true, force: true });
});

test('validateDesignSystemEntry rejects missing declared section ids', async () => {
  const tempDir = await setupFixture();
  const htmlPath = path.join(tempDir, 'design-systems', 'Broken_System_Design_System.html');
  const metadataPath = path.join(tempDir, 'catalog', 'metadata', 'broken-system.json');

  await writeFile(htmlPath, makeHtml().replace('id="copy"', 'id="copy-missing"'), 'utf8');
  await writeFile(metadataPath, JSON.stringify(makeMetadata({
    slug: 'broken-system',
    file: 'Broken_System_Design_System.html',
    repoPath: 'design-systems/Broken_System_Design_System.html',
    metadataPath: 'catalog/metadata/broken-system.json'
  }), null, 2), 'utf8');

  await assert.rejects(
    () => validateDesignSystemEntry(metadataPath, tempDir),
    /Declared section id "copy" was not found/
  );

  await rm(tempDir, { recursive: true, force: true });
});

test('buildCatalog emits manifest, llms.txt, sitemap, raw pages, and detail pages from sidecar metadata', async () => {
  const tempDir = await setupFixture();
  const outputDir = path.join(tempDir, 'dist');

  await writeFile(path.join(tempDir, 'design-systems', 'Alpha_Design_System.html'), makeHtml('Alpha summary'), 'utf8');
  await writeFile(path.join(tempDir, 'design-systems', 'Beta_Design_System.html'), makeHtml('Beta summary'), 'utf8');

  await writeFile(path.join(tempDir, 'catalog', 'metadata', 'alpha.json'), JSON.stringify(makeMetadata({
    slug: 'alpha',
    name: 'Alpha',
    title: 'Alpha Design System',
    file: 'Alpha_Design_System.html',
    repoPath: 'design-systems/Alpha_Design_System.html',
    metadataPath: 'catalog/metadata/alpha.json'
  }), null, 2), 'utf8');

  await writeFile(path.join(tempDir, 'catalog', 'metadata', 'beta.json'), JSON.stringify(makeMetadata({
    slug: 'beta',
    name: 'Beta',
    title: 'Beta Design System',
    file: 'Beta_Design_System.html',
    repoPath: 'design-systems/Beta_Design_System.html',
    metadataPath: 'catalog/metadata/beta.json'
  }), null, 2), 'utf8');

  const build = await buildCatalog({
    rootDir: tempDir,
    outDir: outputDir,
    site: {
      title: 'Catalog',
      tagline: 'Static catalog for test fixtures.',
      origin: 'https://example.com'
    }
  });

  assert.equal(build.systems.length, 2);

  const manifest = JSON.parse(await readFile(path.join(outputDir, 'manifest', 'design-systems.json'), 'utf8'));
  assert.equal(manifest.systemCount, 2);
  assert.equal(manifest.systems[0].urls.detail.startsWith('/systems/'), true);

  await readFile(path.join(outputDir, 'index.html'), 'utf8');
  await readFile(path.join(outputDir, 'llms.txt'), 'utf8');
  await readFile(path.join(outputDir, 'sitemap.xml'), 'utf8');
  await readFile(path.join(outputDir, 'raw', 'Alpha_Design_System.html'), 'utf8');
  await readFile(path.join(outputDir, 'systems', 'alpha', 'index.html'), 'utf8');

  await rm(tempDir, { recursive: true, force: true });
});
