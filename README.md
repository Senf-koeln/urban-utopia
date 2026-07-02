# Urban Utopia

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

AI-powered workshop tool for visualizing urban planning ideas. Participants pick a real-world location, add objects from a tile library, and generate before/after “utopia” visuals with Google Gemini.

**Live:** [urban-utopia.ai](https://urban-utopia.ai)

## Structure

```
src/       React app (workshop UI, admin, landing)
server/    Express API (/api/gemini, /api/contact)
ui/        Design system components
shared/    Shared utilities, i18n, Firebase helpers
tokens/    Design tokens (Tailwind + CSS variables)
```

Single `package.json` — no Yarn workspaces or Turbo.

## Quick start

**Prerequisites:** Node.js 22.14.0, Yarn 4.8.1 (`corepack enable`)

```bash
yarn install
cp .env.example .env   # fill in Firebase + GCP credentials
yarn dev
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:3002 |
| API      | http://localhost:8082 |

**Workshop demo access code:** `demo-workshop`

UI-only (no dotenvx keys): `yarn dev:plain`

## Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Tokens watch + API + Vite dev server |
| `yarn build` | Tokens + frontend + server |
| `yarn server:dev` | Express API only |
| `yarn tokens:build` | Regenerate CSS from design tokens |

## Environment

Copy `.env.example` → `.env`. See [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md).

## Deploy

- **Docker:** `Dockerfile` (Vite build + Express on port 80)
- **CI:** `.github/workflows/build-deploy.yml`

## Contributing & security

[CONTRIBUTING.md](CONTRIBUTING.md) · [SECURITY.md](SECURITY.md) · [LICENSE](LICENSE)
