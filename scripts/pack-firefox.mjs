#!/usr/bin/env node
/**
 * Pack dist-firefox/ into release/dastresa-firefox-<version>.zip for AMO upload.
 * Uses forward-slash zip entry names (AMO rejects Windows backslash paths).
 * Omits *.map source maps from the upload package.
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

function listFiles(dir) {
  /** @type {string[]} */
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

function toZipEntry(absPath) {
  return relative(distFirefox, absPath).split(sep).join('/');
}

mkdirSync(releaseDir, { recursive: true });
if (existsSync(zipPath)) rmSync(zipPath);

const files = listFiles(distFirefox).filter((f) => !f.endsWith('.map'));

function packWithPowerShellForwardSlash() {
  const listPath = join(releaseDir, `.firefox-zip-list-${process.pid}.txt`);
  const lines = files.map((f) => `${f}\t${toZipEntry(f)}`);
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
}
`;
  execFileSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'inherit' });
}

try {
  if (process.platform === 'win32') {
    packWithPowerShellForwardSlash();
  } else {
    execFileSync('zip', ['-r', zipPath, '.', '-x', '*.map', '-x', '**/*.map'], {
      cwd: distFirefox,
      stdio: 'inherit',
    });
  }
} catch (error) {
  console.error('[pack:firefox] Failed to create zip.', error);
  process.exit(1);
}

console.log(`[pack:firefox] Wrote ${zipPath}`);
console.log('[pack:firefox] Upload this zip at https://addons.mozilla.org/developers/');
