#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
# Use port 5432 as default, extract host from DATABASE_URL via envsubst-free pattern
# Avoid Node.js URL parsing as the password may contain special characters
# that break the WHATWG URL parser (/, +, =).
DB_HOST="${DATABASE_URL#*@}"
DB_HOST="${DB_HOST%%:*}"

DB_USER="${DATABASE_URL#*://}"
DB_USER="${DB_USER%%:*}"

DB_NAME="${DATABASE_URL##*/}"
DB_NAME="${DB_NAME%%\?*}"

until pg_isready -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" 2>/dev/null; do
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
