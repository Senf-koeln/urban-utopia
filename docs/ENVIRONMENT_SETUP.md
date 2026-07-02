# Environment setup

## Prerequisites

- Node.js 22.14.0 (see root `package.json` engines)
- Yarn 4.8.1 (`corepack enable`)

## Local development (recommended for contributors)

1. Copy the example env file:

   ```bash
   cp apps/utopia/.env.example apps/utopia/.env
   ```

2. Fill in at least:

   | Variable | Purpose |
   |----------|---------|
   | `VITE_FIREBASE_*` | Firebase web client for `urban-utopia-bc48d` |
   | `GCP_PROJECT_ID` | Vertex AI / Gemini (server) |
   | `GOOGLE_APPLICATION_CREDENTIALS` | Service account JSON path (server) |

3. Start the stack:

   ```bash
   yarn dev
   ```

   Vite proxies `/api/*` → `http://localhost:8082`.

4. **Workshop access:** use code `demo-workshop` (see `apps/utopia/src/aiImageGenerator/helpers/ids.ts`).

### Without dotenvx / team keys

If you do not have a root `.env.keys` file:

```bash
yarn workspace @urban-utopia/web dev:plain
```

Run the API separately with env vars exported, or add server vars to the same `apps/utopia/.env` (the server reads `process.env` at runtime).

## Server environment (Express)

The API handles Gemini image generation and optional Slack contact notifications.

| Variable | Required | Description |
|----------|----------|-------------|
| `GCP_PROJECT_ID` | Yes* | GCP project for Vertex AI |
| `GOOGLE_APPLICATION_CREDENTIALS` | Yes* | Path to service account JSON |
| `SLACK_WEBHOOK_URL` | For contact form | Slack incoming webhook |
| `GEMINI_TEXT_MODEL` | No | Default text model |
| `GEMINI_IMAGE_MODEL` | No | Default image model |
| `PORT` | No | Default `8082` (dev) / `80` (Docker) |

\* Or use workload identity on the host.

## Maintainer: encrypted env (CI / Docker)

Team maintainers can encrypt env files for reproducible builds:

```bash
yarn secrets:encrypt   # writes *.encrypted from local .env
yarn secrets:decrypt   # restores local .env (requires .env.keys)
```

GitHub Actions decrypts `apps/utopia/.env.encrypted` at build time via `DOTENV_PRIVATE_KEY` / `DOTENV_PRIVATE_KEY_PROD` repository secrets. **Private keys are never committed.**

## Docker / CI

- Build: `apps/utopia/Dockerfile`
- Staging compose: `docker-compose.utopia-staging.yaml`
- Workflow: `.github/workflows/build-deploy.yml`

## Firebase client config

`VITE_FIREBASE_*` values are **public web client credentials**. Restrict them in Google Cloud (API key HTTP referrers, enabled APIs). Do not commit service account JSON or Slack webhooks.
