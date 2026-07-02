# syntax=docker/dockerfile:1.7
#
# Urban Utopia — Vite SPA + Express API/static server (single image).

FROM node:22-bookworm-slim AS build

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /repo

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn

ENV HUSKY=0

RUN --mount=type=cache,id=urban-utopia-yarn-cache,target=/repo/.yarn/cache \
    yarn install --immutable

ARG APP_ENV
ARG APP_VERSION
ARG VITE_APP_MODE
ARG DOTENV_PRIVATE_KEY
ARG DOTENV_PRIVATE_KEY_PROD
ENV APP_ENV=${APP_ENV}
ENV VITE_APP_VERSION=${APP_VERSION}
ENV DOTENV_PRIVATE_KEY=${DOTENV_PRIVATE_KEY}
ENV DOTENV_PRIVATE_KEY_PROD=${DOTENV_PRIVATE_KEY_PROD}

COPY . .

RUN node scripts/write-docker-env-keys.cjs \
    && node scripts/verify-docker-dotenv-key.cjs

RUN yarn tokens:build

ARG DOTENV_PRIVATE_KEY
ARG DOTENV_PRIVATE_KEY_PROD
ARG VITE_APP_MODE
ENV DOCKER_BUILD=true
RUN if [ -n "$VITE_APP_MODE" ]; then export VITE_APP_MODE="$VITE_APP_MODE"; fi; \
    yarn build:docker \
    && node scripts/verify-vite-build-secrets.cjs dist

RUN yarn server:build

FROM build AS prune-deps

RUN yarn workspaces focus --production 2>/dev/null || \
    npm prune --omit=dev

FROM build AS runtime-dist

RUN cp -a /repo/dist /runtime-dist \
    && find /runtime-dist -type f -name '*.map' -delete

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80

COPY --from=runtime-dist /runtime-dist ./dist
COPY --from=build /repo/server/dist ./server/dist
COPY --from=build /repo/server/package.json ./server/package.json
COPY --from=build /repo/node_modules ./node_modules

EXPOSE 80
CMD ["node", "server/dist/index.js"]
