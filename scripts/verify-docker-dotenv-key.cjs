#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const KEYS_FILE = path.join(REPO_ROOT, '.env.keys');
const DOTENVX = path.join(REPO_ROOT, 'node_modules', '.bin', 'dotenvx');
const hasLocalDotenvx = fs.existsSync(DOTENVX);
const DOTENVX_COMMAND = hasLocalDotenvx ? DOTENVX : 'npx';
const DOTENVX_ARGS = hasLocalDotenvx ? [] : ['--yes', '@dotenvx/dotenvx'];
const appEnv = process.env.APP_ENV;

const baseKeyHint = {
  secret: 'DOTENV_PRIVATE_KEY',
  source: '# .env',
};
const prodKeyHint = {
  secret: 'DOTENV_PRIVATE_KEY_PROD',
  source: '# .env.prod',
};

const envFiles =
  appEnv === 'production'
    ? [{ path: '.env.prod.encrypted', keyHint: prodKeyHint }]
    : [{ path: '.env.encrypted', keyHint: baseKeyHint }];

for (const { path: rel, keyHint } of envFiles) {
  const envFile = path.join(REPO_ROOT, rel);
  if (!fs.existsSync(envFile)) {
    console.warn(`[verify-docker-dotenv-key] skip missing ${rel}`);
    continue;
  }

  const result = spawnSync(
    DOTENVX_COMMAND,
    [
      ...DOTENVX_ARGS,
      'run',
      '--strict',
      '-fk',
      KEYS_FILE,
      '-f',
      envFile,
      '--',
      'node',
      '-e',
      'process.exit(0)',
    ],
    { cwd: REPO_ROOT, encoding: 'utf8' },
  );

  if (result.status === 0) continue;

  const detail = (result.stderr || result.stdout || '').trim();
  console.error(
    `[verify-docker-dotenv-key] Cannot decrypt ${rel} with the supplied build key.`,
  );
  if (detail) console.error(detail);
  console.error(`
Fix GitHub Actions secret ${keyHint.secret} (must match ${keyHint.source} in team .env.keys).
`);
  process.exit(1);
}

console.log(
  `[verify-docker-dotenv-key] OK — build key decrypts ${envFiles.map((file) => file.path).join(', ')}`,
);
