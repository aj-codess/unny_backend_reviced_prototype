# Running Unny Backend with Docker

This replaces Sections 3–7 of `Unny-Backend-Setup-Guide.docx` (installing
PostgreSQL, creating the DB/user, running migrations, seeding, starting the
server) with two containers: `postgres` and `backend`. Nothing needs to be
installed on your machine except Docker.

## Files added

| File | Purpose |
| --- | --- |
| `Dockerfile` | Multi-stage build: `deps` → `build` (Prisma generate) → `prod-deps` → `runtime`, plus a separate `dev` stage for hot-reload. |
| `docker-compose.yml` | Production-style stack: Postgres + backend, healthchecked, named volumes. |
| `docker-compose.dev.yml` | Overlay for local development — bind-mounts source, runs `npm run dev` (nodemon). |
| `docker/entrypoint.sh` | Runs on every container start: waits for Postgres, `prisma generate`, `prisma migrate deploy`, seeds tags, then starts the server. This is what makes the whole thing error-free — no more forgetting a step from the manual guide. |
| `.env.docker.example` | Template for the env vars the containers read. |
| `.dockerignore` | Keeps `node_modules`, `.env`, and the generated Prisma client out of the build context. |

## 1. One-time setup

```bash
cp .env.docker.example .env.docker
```

Edit `.env.docker` and set:
- `POSTGRES_PASSWORD` — a real password (not `unny_pass`)
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — generate two different values:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Leave `AWS_*` and `FIREBASE_*` blank for local use — the app falls back to
local-disk storage and simply skips push notifications, exactly as noted in
Section 5.2 of the setup guide.

**Do not set `DATABASE_URL` yourself** — `docker-compose.yml` builds it from
`POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` and points it at the
`postgres` service by container name, not `localhost`.

## 2. Production-style run

```bash
docker compose up --build
```

This will, in order:
1. Build the Postgres image and start it, waiting until `pg_isready` passes.
2. Build the backend image (installs deps, runs `prisma generate` at build time).
3. Start the backend container, whose entrypoint waits for Postgres to accept
   connections, applies migrations (`prisma migrate deploy`), seeds the tag
   taxonomy, then runs `node server.js`.

Verify:

```bash
curl http://localhost:5000/health
# {"status":"ok","env":"production"}
```

Stop with `docker compose down` (add `-v` to also delete the Postgres data
volume and start completely fresh).

## 3. Development (hot reload)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Your local source is bind-mounted into the container and `nodemon` restarts
the server on file changes — same experience as `npm run dev` in the manual
guide, but Postgres still runs in its own container so you never touch
`psql` directly.

## 4. Common tasks

```bash
# Tail backend logs
docker compose logs -f backend

# Open a shell in the backend container
docker compose exec backend sh

# Run Prisma Studio against the containerized DB
docker compose exec backend npx prisma studio

# Connect with a host GUI client (TablePlus, DBeaver, psql)
#   host: localhost   port: 5432 (or POSTGRES_HOST_PORT)
#   user/pass/db: from .env.docker

# Create a NEW migration during development (writes files back to your
# host via the bind mount in docker-compose.dev.yml)
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend \
  npx prisma migrate dev --name <migration_name>

# Rebuild after changing package.json
docker compose up --build
```

## 5. Why this maps to every section of the original guide

| Setup Guide Section | Docker equivalent |
| --- | --- |
| §3 Install/start PostgreSQL | `postgres` service, `postgres:16-alpine` image |
| §4 Create DB + user, grant `CREATEDB` | `POSTGRES_USER`/`POSTGRES_DB`/`POSTGRES_PASSWORD` env vars create these automatically on first boot. `CREATEDB` isn't needed — containers use `prisma migrate deploy`, which doesn't touch a shadow database. |
| §5.2 `.env` / secrets | `.env.docker` |
| §5.3 `npm install` | Baked into the image at build time (`deps` stage) |
| §6 Prisma generate / migrate / seed | Handled automatically by `docker/entrypoint.sh` on every container start |
| §7 `npm run dev` / `npm start` | `docker-compose.dev.yml` overlay / plain `docker-compose.yml` |
| §7.3 Production (`npm ci`, `migrate deploy`) | Exactly what the `runtime` image + entrypoint do |

## 6. Troubleshooting (Docker-specific)

| Symptom | Fix |
| --- | --- |
| `backend` exits immediately with a Postgres connection error | Check `.env.docker` — `POSTGRES_PASSWORD` must match between the `postgres` and `backend` service inputs (it does automatically unless you hand-edited `DATABASE_URL`). |
| `entrypoint.sh: exec format error` | You built on Windows with CRLF line endings. Run `dos2unix docker/entrypoint.sh` or re-save it with LF endings, then rebuild. |
| Migrations fail with "P3005: database schema is not empty" | You're pointing at a Postgres volume from an earlier, differently-migrated run. `docker compose down -v` to reset, or manually resolve per Prisma's migration docs — don't do this against a real production DB. |
| bcrypt / native module errors during build | Shouldn't happen with the provided Debian-based (`node:20-bookworm-slim`) image — if you changed the base image to Alpine, switch it back or add `python3 make g++` to the `deps` stage. |
| Uploads disappear after `docker compose down` | Use `docker compose down` (not `-v`) — the local-storage fallback persists in the `unny-uploads` named volume, which `-v` deletes along with `unny-pgdata`. |
| Port 5000 or 5432 already in use on host | Set `APP_HOST_PORT` / `POSTGRES_HOST_PORT` in `.env.docker` to something free. |
