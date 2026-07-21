#!/usr/bin/env node
/**
 * Pack dist/ into release/dastresa-mvp-<version>.zip for Chrome Web Store upload.
 */
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const releaseDir = join(root, 'release');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const version = pkg.version ?? '0.0.0';
const zipName = `dastresa-mvp-${version}.zip`;
const zipPath = join(releaseDir, zipName);

if (!existsSync(dist)) {
  console.error('[pack:mvp] dist/ missing. Run npm run build first.');
  process.exit(1);
}

mkdirSync(releaseDir, { recursive: true });
if (existsSync(zipPath)) rmSync(zipPath);

const isWin = process.platform === 'win32';
try {
  if (isWin) {
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path '${dist}\\*' -DestinationPath '${zipPath}' -Force"`,
      { stdio: 'inherit' },
    );
  } else {
    execSync(`cd "${dist}" && zip -r "${zipPath}" .`, { stdio: 'inherit', shell: '/bin/bash' });
  }
} catch {
  console.error('[pack:mvp] Failed to create zip. On Windows, Compress-Archive must be available.');
  process.exit(1);
}

console.log(`[pack:mvp] Wrote ${zipPath}`);
console.log('[pack:mvp] Upload this zip in Chrome Web Store Developer Dashboard.');
