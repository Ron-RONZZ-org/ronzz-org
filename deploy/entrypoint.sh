#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
DB_HOST="$(node -e "
  const url = require('url');
  const u = new URL(process.env.DATABASE_URL);
  console.log(u.hostname);
")"
until pg_isready -h "$DB_HOST" -U ronzz -d ronzz 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL is ready."

# Run migrations
echo "Running database migrations..."
pnpm --filter database db:migrate:pg
echo "Migrations applied successfully."

# Seed admin user
echo "Seeding database..."
pnpm --filter database db:seed
echo "Seed completed successfully."

# Start application
echo "Starting application..."
exec "$@"
