# Firebase Cloud Functions for Urban Utopia (`urban-utopia-bc48d`)

Hosts the Firebase HTTP functions used by Urban Utopia:

- `gemini` (`europe-west1`) — Vertex AI text & image generation for Utopia
- `onUtopiaContactRequest` (`europe-west1`) — contact form to Slack (requires `SLACK_WEBHOOK_URL`)

## Setup

```bash
cd cloudFunctions/functions
npm install
npx firebase-tools login
```

## Deploy

From the repo root:

```bash
yarn deploy:functions
```

Or from `cloudFunctions/functions`:

```bash
npm run deploy
```

Default Firebase project (`.firebaserc`): `urban-utopia-bc48d`.
