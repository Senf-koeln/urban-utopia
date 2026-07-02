#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const ROOT_KEYS_FILE = path.join(REPO_ROOT, '.env.keys');
const DOTENVX = path.join(REPO_ROOT, 'node_modules', '.bin', 'dotenvx');

const TARGETS = ['.env', '.env.prod'];

const PRESERVE_PLAINTEXT_ON_ENCRYPT = new Set(['.env', '.env.prod']);

function parseArgs(argv) {
  const cmd = argv[0] || 'encrypt';
  const all = argv.includes('--all');
  const filesArg = argv.find((a) => a.startsWith('--files='));
  const files = filesArg
    ? filesArg
        .slice('--files='.length)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : TARGETS;
  return { cmd, all, files };
}

function runDotenvx(args) {
  return spawnSync(DOTENVX, args, {
    cwd: REPO_ROOT,
    env: process.env,
    encoding: 'utf8',
  });
}

function stripDotenvxHeaders(content) {
  const lines = content.split('\n');
  const out = [];
  let inPublicKeyBanner = false;

  for (const line of lines) {
    if (/^#\/-+\[DOTENV_PUBLIC_KEY\]/.test(line)) {
      inPublicKeyBanner = true;
      continue;
    }
    if (inPublicKeyBanner) {
      if (/^#\//.test(line)) continue;
      inPublicKeyBanner = false;
    }
    if (/^DOTENV_PUBLIC_KEY=/.test(line)) continue;
    out.push(line);
  }
  return out.join('\n');
}

function encryptFile(relPath) {
  const abs = path.join(REPO_ROOT, relPath);
  if (!fs.existsSync(abs)) {
    console.warn(`[dotenvx-secrets] skip missing ${relPath}`);
    return;
  }
  const encryptedPath = `${abs}.encrypted`;
  const isProd = relPath.endsWith('.env.prod');
  const keyFlag = isProd ? '-k' : '-k';
  const keyEnv = isProd ? 'DOTENV_PRIVATE_KEY_PROD' : 'DOTENV_PRIVATE_KEY';
  if (!process.env[keyEnv]) {
    console.error(`[dotenvx-secrets] ${keyEnv} is required to encrypt ${relPath}`);
    process.exit(1);
  }
  const tmpPlain = path.join(os.tmpdir(), `dotenvx-plain-${path.basename(relPath)}`);
  fs.writeFileSync(tmpPlain, stripDotenvxHeaders(fs.readFileSync(abs, 'utf8')));
  const result = runDotenvx([
    'encrypt',
    '-f',
    tmpPlain,
    keyFlag,
    process.env[keyEnv],
    '--stdout',
  ]);
  fs.unlinkSync(tmpPlain);
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
  fs.writeFileSync(encryptedPath, result.stdout);
  if (!PRESERVE_PLAINTEXT_ON_ENCRYPT.has(relPath)) {
    fs.unlinkSync(abs);
  }
  console.log(`[dotenvx-secrets] encrypted ${relPath} -> ${relPath}.encrypted`);
}

function decryptFile(relPath) {
  const encrypted = `${path.join(REPO_ROOT, relPath)}.encrypted`;
  if (!fs.existsSync(encrypted)) {
    console.warn(`[dotenvx-secrets] skip missing ${relPath}.encrypted`);
    return;
  }
  const isProd = relPath.endsWith('.env.prod');
  const keyEnv = isProd ? 'DOTENV_PRIVATE_KEY_PROD' : 'DOTENV_PRIVATE_KEY';
  if (!process.env[keyEnv]) {
    console.error(`[dotenvx-secrets] ${keyEnv} is required to decrypt ${relPath}`);
    process.exit(1);
  }
  const result = runDotenvx(['decrypt', '-f', encrypted, '-k', process.env[keyEnv], '--stdout']);
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
  fs.writeFileSync(path.join(REPO_ROOT, relPath), result.stdout);
  console.log(`[dotenvx-secrets] decrypted ${relPath}.encrypted -> ${relPath}`);
}

function smokeFile(relPath) {
  const encrypted = `${path.join(REPO_ROOT, relPath)}.encrypted`;
  if (!fs.existsSync(encrypted)) return;
  const isProd = relPath.endsWith('.env.prod');
  const keyEnv = isProd ? 'DOTENV_PRIVATE_KEY_PROD' : 'DOTENV_PRIVATE_KEY';
  const result = runDotenvx([
    'run',
    '--strict',
    '-fk',
    ROOT_KEYS_FILE,
    '-f',
    encrypted,
    '--',
    'node',
    '-e',
    'process.exit(0)',
  ]);
  if (result.status !== 0) {
    console.error(`[dotenvx-secrets] smoke failed for ${relPath}`);
    process.exit(1);
  }
  console.log(`[dotenvx-secrets] smoke OK ${relPath}.encrypted`);
}

const { cmd, all, files } = parseArgs(process.argv.slice(2));
const targets = all ? TARGETS : files;

for (const rel of targets) {
  if (cmd === 'encrypt') encryptFile(rel);
  else if (cmd === 'decrypt') decryptFile(rel);
  else if (cmd === 'smoke') smokeFile(rel);
  else {
    console.error(`Unknown command: ${cmd}`);
    process.exit(1);
  }
}
