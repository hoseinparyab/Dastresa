/**
 * Verifies Husky is wired for this clone (Windows-friendly).
 * Run: npm run hooks:check
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const required = ['.husky/pre-commit', '.husky/commit-msg', '.husky/pre-push', 'commitlint.config.js'];

let ok = true;
for (const rel of required) {
  const path = join(root, rel);
  if (!existsSync(path)) {
    console.error(`missing: ${rel}`);
    ok = false;
  }
}

let hooksPath = '';
try {
  hooksPath = execSync('git config --get core.hooksPath', { encoding: 'utf8' }).trim();
} catch {
  hooksPath = '';
}

if (hooksPath !== '.husky/_') {
  console.error(`core.hooksPath should be ".husky/_" (got "${hooksPath || '(empty)'}")`);
  console.error('Fix: npm run prepare');
  ok = false;
}

if (!existsSync(join(root, '.husky/_/husky.sh'))) {
  console.error('missing .husky/_/husky.sh — run: npm run prepare');
  ok = false;
}

const cfg = readFileSync(join(root, 'commitlint.config.js'), 'utf8');
if (!cfg.includes('config-conventional')) {
  console.error('commitlint.config.js does not extend conventional config');
  ok = false;
}

if (!ok) {
  process.exit(1);
}

console.log('Husky hooks OK:');
console.log('  pre-commit  → lint-staged');
console.log('  commit-msg  → commitlint (conventional)');
console.log('  pre-push    → typecheck + lint');
