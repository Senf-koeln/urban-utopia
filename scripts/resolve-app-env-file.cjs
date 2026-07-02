#!/usr/bin/env node
'use strict';

/**
 * Resolve which dotenvx env file to load for local dev / Docker builds.
 *
 * - production (APP_ENV) → .env.prod (plaintext) or .env.prod.encrypted
 * - dev + staging → .env (plaintext) or .env.encrypted
 *
 * Uses process.cwd() (the app workspace), not INIT_CWD. Turbo/`yarn dev` from the
 * monorepo root sets INIT_CWD to the repo root while cwd is `apps/<app>/`.
 *
 * Vite mode (APP_ENV) is separate; see package.json build/dev scripts.
 */

const fs = require('fs');
const path = require('path');

/** Plaintext env files are often gitignored placeholders; skip empty ones. */
function hasUsableEnvContent(filePath) {
  if (!fs.existsSync(filePath)) return false;
  if (fs.statSync(filePath).size === 0) return false;
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split('\n').some((line) => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith('#') && trimmed.includes('=');
  });
}

const appEnv = process.env.APP_ENV;
const cwd = process.cwd();

if (appEnv === 'production') {
  const plain = path.join(cwd, '.env.prod');
  const encrypted = path.join(cwd, '.env.prod.encrypted');
  if (hasUsableEnvContent(plain)) {
    process.stdout.write('.env.prod');
    process.exit(0);
  }
  if (fs.existsSync(encrypted)) {
    process.stdout.write('.env.prod.encrypted');
    process.exit(0);
  }
  console.error(
    `Missing .env.prod or .env.prod.encrypted in ${cwd} (APP_ENV=production).`,
  );
  process.exit(1);
}

const plain = path.join(cwd, '.env');
const encrypted = path.join(cwd, '.env.encrypted');

if (hasUsableEnvContent(plain)) {
  process.stdout.write('.env');
  process.exit(0);
}

if (fs.existsSync(encrypted)) {
  process.stdout.write('.env.encrypted');
  process.exit(0);
}

console.error(
  `Missing .env or .env.encrypted in ${cwd}. Copy .env.example to .env and fill in values.`,
);
process.exit(1);
