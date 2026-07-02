#!/usr/bin/env node
'use strict';

/**
 * Fail the Docker/CI build if Vite output still contains dotenvx ciphertext.
 * Prevents shipping bundles with `encrypted:…` Firebase keys and similar secrets.
 */

const fs = require('fs');
const path = require('path');

const distDir = path.resolve(process.argv[2] || 'dist');
const assetsDir = path.join(distDir, 'assets');

function walkJsFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJsFiles(full, out);
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

const files = walkJsFiles(assetsDir);
const hits = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('encrypted:')) {
    hits.push(path.relative(process.cwd(), file));
  }
}

if (hits.length > 0) {
  console.error(
    '[verify-vite-build-secrets] Found dotenvx ciphertext in built JS — secrets were not decrypted at build time.',
  );
  for (const file of hits.slice(0, 5)) {
    console.error(`  - ${file}`);
  }
  if (hits.length > 5) {
    console.error(`  … and ${hits.length - 5} more`);
  }
  process.exit(1);
}

console.log(
  `[verify-vite-build-secrets] OK — no encrypted: values in ${files.length} bundle file(s).`,
);
