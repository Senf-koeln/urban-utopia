# Security Policy

## Supported versions

Security fixes are applied to the `main` branch and the latest release tag.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security-sensitive reports.

Email [hello@urban-utopia.ai](mailto:hello@urban-utopia.ai) with:

- A description of the issue and potential impact
- Steps to reproduce (proof-of-concept if available)
- Affected commit, branch, or deployment

We aim to acknowledge reports within a few business days and will coordinate disclosure once a fix is available.

## Secrets and credentials

- Never commit `.env`, service account JSON, API keys, or workshop participant lists.
- Use `apps/utopia/.env.example` as a template; keep real values in local `.env` files (gitignored).
- Production deployments should inject secrets via your host (e.g. GitHub Actions secrets, Coolify env).

## Firebase

Client-side Firebase config (`VITE_FIREBASE_*`) is intended for browser use. Restrict API keys in the [Google Cloud Console](https://console.cloud.google.com/) (HTTP referrer restrictions, enabled APIs).
