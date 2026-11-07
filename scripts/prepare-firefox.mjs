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

// Previous id dastresa@najino.com was reserved/locked on AMO after a draft/delete.
const GECKO_ID = 'dastresa-extension@najino.com';
/** data_collection_permissions requires Firefox Desktop 140+. */
const GECKO_MIN = '140.0';
/** Same key on Android needs 142+. */
const GECKO_ANDROID_MIN = '142.0';

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

// Firefox ignores service_worker; use event-page scripts only (keeps type: module).
const sw = manifest.background?.service_worker;
if (typeof sw === 'string' && sw.length > 0) {
  const type = manifest.background?.type;
  manifest.background = {
    scripts: [sw],
    ...(type ? { type } : {}),
  };
}

manifest.browser_specific_settings = {
  gecko: {
    id: GECKO_ID,
    strict_min_version: GECKO_MIN,
    // Required for new AMO submissions (Nov 2025+). Matches docs/PRIVACY.md: no remote PII.
    data_collection_permissions: {
      required: ['none'],
    },
  },
  gecko_android: {
    strict_min_version: GECKO_ANDROID_MIN,
  },
};

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(`[prepare-firefox] Wrote ${distFirefox}`);
console.log(
  `[prepare-firefox] gecko.id=${GECKO_ID} min=${GECKO_MIN} android=${GECKO_ANDROID_MIN}`,
);
