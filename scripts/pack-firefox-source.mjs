#!/usr/bin/env node
/**
 * Source zip for AMO (required when using Vite minify/bundle).
 * Forward-slash entries; excludes node_modules/dist/release/.git.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const releaseDir = join(root, 'release');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const version = pkg.version ?? '0.0.0';
const zipPath = join(releaseDir, `dastresa-firefox-source-${version}.zip`);

const SKIP_DIRS = new Set([
  '.git',
  '.cursor',
  '.husky',
  '.vite',
  'node_modules',
  'dist',
  'dist-firefox',
  'release',
  'coverage',
  'playwright-report',
  'test-results',
]);

function listFiles(dir) {
  /** @type {string[]} */
  const out = [];
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    if (name === '.env' || name.startsWith('.env.') || name.endsWith('.log')) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

mkdirSync(releaseDir, { recursive: true });
if (existsSync(zipPath)) rmSync(zipPath);

const buildTxtPath = join(releaseDir, `.amo-build-${process.pid}.txt`);
writeFileSync(
  buildTxtPath,
  `Dastresa ${version} — AMO source build instructions
====================================================

Prerequisites: Node.js 20+, npm

Reproduce the exact Firefox package:
1. npm ci
2. npm run build:firefox
3. npm run pack:firefox

Outputs:
- dist-firefox/
- release/dastresa-firefox-${version}.zip

Notes:
- prepare-firefox.mjs patches Chrome dist/ → dist-firefox/ for Gecko
  (id, background.scripts, data_collection_permissions, min versions).
- pack-firefox.mjs uses "/" zip paths and omits *.map.
- License: MIT (LICENSE)
`,
  'utf8',
);

const files = listFiles(root);
const listPath = join(releaseDir, `.firefox-source-list-${process.pid}.txt`);
const lines = [
  `${buildTxtPath}\tAMO_BUILD.txt`,
  ...files.map((f) => `${f}\t${relative(root, f).split(sep).join('/')}`),
];
writeFileSync(listPath, `${lines.join('\n')}\n`, 'utf8');

const ps = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipPath = '${zipPath.replace(/'/g, "''")}'
$listPath = '${listPath.replace(/'/g, "''")}'
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')
try {
  Get-Content -LiteralPath $listPath -Encoding UTF8 | ForEach-Object {
    if (-not $_) { return }
    $parts = $_.Split([char]9, 2)
    $src = $parts[0]
    $entry = $parts[1]
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $zip, $src, $entry, [System.IO.Compression.CompressionLevel]::Optimal
    )
  }
} finally {
  $zip.Dispose()
  if (Test-Path $listPath) { Remove-Item -Force $listPath }
  if (Test-Path '${buildTxtPath.replace(/'/g, "''")}') { Remove-Item -Force '${buildTxtPath.replace(/'/g, "''")}' }
}
`;

execFileSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'inherit' });

if (!existsSync(zipPath)) {
  console.error('[pack:firefox-source] zip missing after pack');
  process.exit(1);
}

console.log(`[pack:firefox-source] Wrote ${zipPath}`);
console.log('[pack:firefox-source] On AMO: choose Yes → upload this source zip');
