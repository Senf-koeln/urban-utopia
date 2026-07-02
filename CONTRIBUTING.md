# Contributing

Thanks for your interest in Urban Utopia!

## Development setup

1. **Requirements:** Node.js 22.14.0, Yarn 4.8.1 (`corepack enable`)
2. **Install:** `yarn install`
3. **Environment:** copy `apps/utopia/.env.example` → `apps/utopia/.env` and fill in values
4. **Run:** `yarn dev` (frontend on :3002, API on :8082)

For a quick UI-only run without dotenvx keys: `yarn workspace @urban-utopia/web dev:plain`

## Workshop access in development

Use access code **`demo-workshop`** when prompted. Edit `apps/utopia/src/aiImageGenerator/helpers/ids.ts` to add more demo codes locally.

## Code style

- Lint: `yarn lint` / `yarn format`
- Match existing patterns in the file you edit
- Translations: add keys to `packages/shared/locales/*.json` — do not pass fallback strings to `t()`

## Pull requests

1. Fork and create a feature branch from `main`
2. Keep changes focused; describe **why** in the PR body
3. Note any env vars or deploy steps reviewers should know about

## Maintainer deploy flow

Encrypted env for CI/Docker is optional for contributors. Maintainers use dotenvx (`yarn secrets:encrypt` / `yarn secrets:decrypt`) and GitHub Actions secrets — see [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md).
