#!/bin/sh
# Health check — curl the application health endpoint and alert on failure.
set -e

HEALTH_URL="${HEALTH_URL:-http://localhost:3000/api/v1/health}"
ALERT_SCRIPT="$(dirname "$0")/alert.sh"

HEALTH=$(curl -sf "$HEALTH_URL" 2>/dev/null || echo "FAIL")

if [ "$HEALTH" = "FAIL" ]; then
  "$ALERT_SCRIPT" "Health check failed: $HEALTH_URL returned FAIL"
  exit 1
fi

LOGDIR="/var/log/ronzz"
mkdir -p "$LOGDIR"
echo "$(date -u +"%Y-%m-%dT%H:%M:%S%z") health=ok" >> "$LOGDIR/health.log"
exit 0
