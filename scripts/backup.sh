#!/bin/sh
# Database backup — runs pg_dump via docker exec on the PostgreSQL container.
# Intended to be run from the host via cron or systemd timer.
set -e

BACKUP_DIR="${BACKUP_DIR:-/var/backups/ronzz}"
DB_CONTAINER="${DB_CONTAINER:-ronzz-db}"
DB_USER="${DB_USER:-ronzz}"
DB_NAME="${DB_NAME:-ronzz}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/ronzz_${TIMESTAMP}.sql"

echo "Backing up database ${DB_NAME} from container ${DB_CONTAINER}..."

docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

gzip "$BACKUP_FILE"
echo "Backup written: ${BACKUP_FILE}.gz"

# Remove backups older than retention period
find "$BACKUP_DIR" -name "ronzz_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete
echo "Removed backups older than ${RETENTION_DAYS} days."

exit 0
