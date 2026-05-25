#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
until pg_isready -h "$(echo "$DATABASE_URL" | sed 's/.*@\(.*\):.*/\1/')" -U ronzz -d ronzz 2>/dev/null; do
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
