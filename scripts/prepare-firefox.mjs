#!/usr/bin/env node
/**
 * Copy Chrome dist/ → dist-firefox/ and patch manifest for Firefox / AMO.
 * Chrome build (dist/) is left untouched.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const distFirefox = join(root, 'dist-firefox');

const GECKO_ID = 'dastresa@najino.com';
/** Firefox 121+ has reliable MV3 service worker support for extensions. */
const GECKO_MIN = '121.0';

if (!existsSync(dist)) {
  console.error('[prepare-firefox] dist/ missing. Run npm run build first.');
  process.exit(1);
}

rmSync(distFirefox, { recursive: true, force: true });
mkdirSync(distFirefox, { recursive: true });
cpSync(dist, distFirefox, { recursive: true });

const manifestPath = join(distFirefox, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

delete manifest.minimum_chrome_version;

manifest.browser_specific_settings = {
  gecko: {
    id: GECKO_ID,
    strict_min_version: GECKO_MIN,
  },
};

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`[prepare-firefox] Wrote ${distFirefox}`);
console.log(`[prepare-firefox] gecko.id=${GECKO_ID} min=${GECKO_MIN}`);
