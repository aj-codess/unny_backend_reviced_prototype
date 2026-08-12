# syntax=docker/dockerfile:1

##############################################################################
# Base — Debian (not Alpine). bcrypt's prebuilt native binary and Prisma's
# query engine both target glibc; using Alpine (musl) is the #1 cause of
# "Cannot find module bcrypt_lib.node" / Prisma engine errors in containers.
##############################################################################
ARG NODE_VERSION=20-bookworm-slim

FROM node:${NODE_VERSION} AS base
WORKDIR /app
# openssl + ca-certificates: required by Prisma's query engine to detect the
# correct engine binary (debian-openssl-3.0.x) and to make outbound HTTPS
# calls (S3, Firebase) work correctly.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

##############################################################################
# deps — install ALL dependencies (incl. devDependencies) once, cached by
# lockfile hash so this layer is skipped on every rebuild unless deps change.
##############################################################################
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

##############################################################################
# build — generate the Prisma Client into src/generated/prisma. This only
# needs the schema, not a live DATABASE_URL, so it's safe to run at build
# time and keeps container startup fast.
##############################################################################
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

##############################################################################
# production deps — a second, production-only install so the final image
# doesn't ship nodemon/prisma-cli/etc.
##############################################################################
FROM base AS prod-deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

##############################################################################
# dev — full deps (incl. nodemon/prisma CLI) + live-mounted source, used by
# docker-compose.dev.yml. Prisma client is generated at container start
# (via entrypoint) instead of build time, since bind-mounted source would
# otherwise shadow the build-stage-generated client.
##############################################################################
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY docker/entrypoint.sh /app/docker/entrypoint.sh
RUN chmod +x /app/docker/entrypoint.sh
EXPOSE 5000
ENTRYPOINT ["/app/docker/entrypoint.sh"]
CMD ["npm", "run", "dev"]

##############################################################################
# runtime — final image actually shipped/run
##############################################################################
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/src/generated ./src/generated
COPY . .
# .dockerignore already excludes node_modules/src/generated/.env/.git, but
# belt-and-suspenders: make sure the generated client from the build stage
# (not a stale local copy) is the one that ships.
RUN rm -rf src/generated && mkdir -p src/generated
COPY --from=build /app/src/generated ./src/generated

# Local-disk upload fallback (see src/services/storage.service.js) writes
# here when AWS_* env vars are blank — give it a persistent, writable home.
RUN mkdir -p /app/storage/uploads

COPY docker/entrypoint.sh /app/docker/entrypoint.sh
RUN chmod +x /app/docker/entrypoint.sh

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||5000)+'/health').then(r=>{if(r.status!==200)process.exit(1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["/app/docker/entrypoint.sh"]
CMD ["node", "server.js"]
