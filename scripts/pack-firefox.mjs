#!/usr/bin/env node
/**
 * Pack dist-firefox/ into release/dastresa-firefox-<version>.zip for AMO upload.
 */
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distFirefox = join(root, 'dist-firefox');
const releaseDir = join(root, 'release');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const version = pkg.version ?? '0.0.0';
const zipName = `dastresa-firefox-${version}.zip`;
const zipPath = join(releaseDir, zipName);

if (!existsSync(distFirefox)) {
  console.error('[pack:firefox] dist-firefox/ missing. Run npm run build:firefox first.');
  process.exit(1);
}

mkdirSync(releaseDir, { recursive: true });
if (existsSync(zipPath)) rmSync(zipPath);

const isWin = process.platform === 'win32';
try {
  if (isWin) {
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path '${distFirefox}\\*' -DestinationPath '${zipPath}' -Force"`,
      { stdio: 'inherit' },
    );
  } else {
    execSync(`cd "${distFirefox}" && zip -r "${zipPath}" .`, {
      stdio: 'inherit',
      shell: '/bin/bash',
    });
  }
} catch {
  console.error('[pack:firefox] Failed to create zip.');
  process.exit(1);
}

console.log(`[pack:firefox] Wrote ${zipPath}`);
console.log('[pack:firefox] Upload this zip at https://addons.mozilla.org/developers/');
