import path from 'node:path';
import { collectMetadataFiles, validateDesignSystemEntry } from './lib/catalog.mjs';

const rootDir = process.cwd();
const files = await collectMetadataFiles(rootDir);

if (files.length === 0) {
  throw new Error('No catalog metadata files found');
}

const seenIds = new Set();
const seenSlugs = new Set();

for (const filePath of files) {
  const record = await validateDesignSystemEntry(filePath, rootDir);
  if (seenIds.has(record.metadata.id)) {
    throw new Error(`Duplicate system id "${record.metadata.id}"`);
  }
  if (seenSlugs.has(record.metadata.slug)) {
    throw new Error(`Duplicate system slug "${record.metadata.slug}"`);
  }
  seenIds.add(record.metadata.id);
  seenSlugs.add(record.metadata.slug);
}

console.log(`Validated ${files.length} design system metadata entries in ${path.basename(rootDir)}.`);
