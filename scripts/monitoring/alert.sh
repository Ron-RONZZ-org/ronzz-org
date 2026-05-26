#!/bin/sh
# Shared alert function for monitoring scripts.
# Logs to /var/log/ronzz/alert.log. Extend to integrate webhook/SMTP later.
set -e

ALERT_LOG="${ALERT_LOG:-/var/log/ronzz/alert.log}"
MESSAGE="${1:-No message}"

mkdir -p "$(dirname "$ALERT_LOG")"
echo "$(date -u +"%Y-%m-%dT%H:%M:%S%z") ALERT: $MESSAGE" >> "$ALERT_LOG"
echo "Alert logged: $MESSAGE"
