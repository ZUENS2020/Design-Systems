import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { buildCatalog, validateDesignSystemFile } from '../scripts/lib/catalog.mjs';

const requiredSections = [
  'overview',
  'foundations',
  'components',
  'motion',
  'iconography',
  'voice-tone'
];

function makeHtml({
  name = 'Test System',
  title = 'Test System Design System',
  slug = 'test-system',
  file = 'Test_System_Design_System.html',
  theme = 'night',
  concept = 'A cinematic system.',
  summary = 'A compact summary for indexing.',
  inspiration = 'A film reference.',
  tags = ['cinematic', 'test'],
  sections = requiredSections
} = {}) {
  const metadata = {
    id: slug,
    slug,
    name,
    title,
    concept,
    inspiration,
    summary,
    tags,
    themes: [theme],
    locale: 'en',
    status: 'stable',
    version: '1.0.0',
    searchText: `${name} ${concept} ${summary} ${tags.join(' ')}`,
    source: {
      file,
      repoPath: file
    },
    updatedAt: '2026-04-29'
  };

  return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <script id="design-system-metadata" type="application/json">${JSON.stringify(metadata)}</script>
</head>
<body>
  <nav>
    ${sections.map((id) => `<a href="#${id}">${id}</a>`).join('')}
  </nav>
  <main>
    ${sections.map((id) => `<section id="${id}"><h2>${id}</h2><p>${summary}</p></section>`).join('')}
  </main>
</body>
</html>`;
}

test('validateDesignSystemFile accepts valid metadata and fixed sections', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'design-systems-'));
  const filePath = path.join(tempDir, 'Test_System_Design_System.html');

  await writeFile(filePath, makeHtml(), 'utf8');

  const result = await validateDesignSystemFile(filePath, tempDir);

  assert.equal(result.metadata.slug, 'test-system');
  assert.deepEqual(result.sections, requiredSections);

  await rm(tempDir, { recursive: true, force: true });
});

test('validateDesignSystemFile rejects missing fixed sections', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'design-systems-'));
  const filePath = path.join(tempDir, 'Broken_System_Design_System.html');

  await writeFile(filePath, makeHtml({
    slug: 'broken-system',
    file: 'Broken_System_Design_System.html',
    sections: requiredSections.slice(0, 5)
  }), 'utf8');

  await assert.rejects(
    () => validateDesignSystemFile(filePath, tempDir),
    /Missing required section ids/
  );

  await rm(tempDir, { recursive: true, force: true });
});

test('buildCatalog emits manifest, llms.txt, sitemap, raw pages, and detail pages', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'design-systems-'));
  const inputDir = path.join(tempDir, 'input');
  const outputDir = path.join(tempDir, 'dist');
  await mkdir(inputDir, { recursive: true });

  await writeFile(path.join(inputDir, 'Alpha_Design_System.html'), makeHtml({
    name: 'Alpha',
    title: 'Alpha Design System',
    slug: 'alpha',
    file: 'Alpha_Design_System.html',
    concept: 'Glass architecture with quiet contrast.'
  }), 'utf8');

  await writeFile(path.join(inputDir, 'Beta_Design_System.html'), makeHtml({
    name: 'Beta',
    title: 'Beta Design System',
    slug: 'beta',
    file: 'Beta_Design_System.html',
    concept: 'Neon transit system with sharp geometry.'
  }), 'utf8');

  const build = await buildCatalog({
    rootDir: inputDir,
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
