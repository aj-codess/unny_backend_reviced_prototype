#!/usr/bin/env sh
# Runs every time the backend container starts (dev and prod alike).
# Order matters and mirrors Section 4/6 of the setup guide exactly, so the
# container behaves the same way the manual steps do — just automatically.
set -e

echo "[entrypoint] Waiting for PostgreSQL at ${DATABASE_URL:-<unset>} ..."

# Small inline wait-loop instead of a separate wait-for-it.sh dependency.
# Parses host:port out of DATABASE_URL so it works regardless of db name/user.
DB_HOST=$(node -e "try{const u=new URL(process.env.DATABASE_URL);console.log(u.hostname)}catch(e){console.log('')}")
DB_PORT=$(node -e "try{const u=new URL(process.env.DATABASE_URL);console.log(u.port||5432)}catch(e){console.log('5432')}")
export DB_HOST DB_PORT

if [ -n "$DB_HOST" ]; then
  ATTEMPTS=0
  MAX_ATTEMPTS=60
  until node -e "require('net').createConnection({host:process.env.DB_HOST,port:process.env.DB_PORT}).on('connect',function(){process.exit(0)}).on('error',function(){process.exit(1)})" 2>/dev/null; do
    ATTEMPTS=$((ATTEMPTS+1))
    if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
      echo "[entrypoint] ERROR: PostgreSQL did not become reachable at $DB_HOST:$DB_PORT after $MAX_ATTEMPTS attempts."
      exit 1
    fi
    echo "[entrypoint] PostgreSQL not ready yet ($DB_HOST:$DB_PORT) — retry $ATTEMPTS/$MAX_ATTEMPTS..."
    sleep 2
  done
fi

echo "[entrypoint] PostgreSQL is reachable."

# Regenerating here is a no-op cost in production (already generated at
# build time) but essential in dev, where the bind-mounted source volume
# shadows whatever was generated inside the image at build time.
echo "[entrypoint] Ensuring Prisma Client is generated..."
npx prisma generate

# migrate deploy = non-interactive, applies committed migrations only.
# This is the correct command for containers (never "migrate dev" here —
# that one prompts for a migration name and expects a dev shadow DB).
echo "[entrypoint] Applying Prisma migrations (migrate deploy)..."
npx prisma migrate deploy

# Idempotent — prisma/seed.js uses upsert(), so safe to run on every boot.
if [ "${SKIP_SEED:-false}" != "true" ]; then
  echo "[entrypoint] Seeding baseline tag taxonomy..."
  node prisma/seed.js
else
  echo "[entrypoint] SKIP_SEED=true — skipping seed step."
fi

echo "[entrypoint] Setup complete. Starting: $*"
exec "$@"
