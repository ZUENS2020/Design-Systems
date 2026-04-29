import path from 'node:path';

import { collectDesignSystemFiles, validateDesignSystemFile } from './lib/catalog.mjs';

const rootDir = process.cwd();
const files = await collectDesignSystemFiles(rootDir);

if (files.length === 0) {
  throw new Error('No canonical design system HTML files found');
}

const seenIds = new Set();
const seenSlugs = new Set();

for (const filePath of files) {
  const record = await validateDesignSystemFile(filePath, rootDir);
  if (seenIds.has(record.metadata.id)) {
    throw new Error(`Duplicate system id "${record.metadata.id}"`);
  }
  if (seenSlugs.has(record.metadata.slug)) {
    throw new Error(`Duplicate system slug "${record.metadata.slug}"`);
  }
  seenIds.add(record.metadata.id);
  seenSlugs.add(record.metadata.slug);
}

console.log(`Validated ${files.length} design systems in ${path.basename(rootDir)}.`);
