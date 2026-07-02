#!/usr/bin/env node
'use strict';

/**
 * CI/Docker builds use dotenvx `-fk ../../.env.keys`, but `.env.keys` is never
 * copied into the image. Write a minimal repo-root keys file from build args
 * (DOTENV_PRIVATE_KEY / DOTENV_PRIVATE_KEY_PROD) before `yarn build`.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const OUT = path.join(REPO_ROOT, '.env.keys');
const appEnv = process.env.APP_ENV;

const devKey = process.env.DOTENV_PRIVATE_KEY?.trim();
const prodKey = process.env.DOTENV_PRIVATE_KEY_PROD?.trim();

if (appEnv === 'production') {
  if (!prodKey) {
    console.error(
      'ERROR: DOTENV_PRIVATE_KEY_PROD build arg is required for APP_ENV=production.',
    );
    process.exit(1);
  }
} else if (!devKey) {
  console.error(
    'ERROR: DOTENV_PRIVATE_KEY build arg is required for dev/staging Docker builds.',
  );
  process.exit(1);
}

const lines = [
  '#/ docker build — generated from CI build args; not committed',
  '',
  '# .env (apps dev+staging)',
  `DOTENV_PRIVATE_KEY=${devKey || ''}`,
  '',
  '# .env.prod (apps production)',
  `DOTENV_PRIVATE_KEY_PROD=${prodKey || ''}`,
  '',
];

fs.writeFileSync(OUT, lines.join('\n'), { mode: 0o600 });
console.log(`[write-docker-env-keys] wrote ${path.relative(REPO_ROOT, OUT)}`);
