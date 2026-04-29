import path from 'node:path';
import { readFile } from 'node:fs/promises';

import { buildCatalog } from './lib/catalog.mjs';

const rootDir = process.cwd();
const configPath = path.join(rootDir, 'site.config.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));

const site = {
  ...config,
  origin: process.env.SITE_ORIGIN || config.origin
};

await buildCatalog({
  rootDir,
  outDir: path.join(rootDir, 'dist'),
  site
});
