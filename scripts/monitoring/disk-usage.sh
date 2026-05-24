#!/bin/sh
# Disk usage monitor — alert if any mount exceeds threshold.
set -e

THRESHOLD="${THRESHOLD:-90}"
ALERT_SCRIPT="$(dirname "$0")/alert.sh"
LOGFILE="${LOGFILE:-/var/log/ronzz/disk.log}"

mkdir -p "$(dirname "$LOGFILE")"

df -h | awk 'NR>1 {print $5, $6}' | sed 's/%//' | while read -r usage mount; do
  if [ "$usage" -gt "$THRESHOLD" ] 2>/dev/null; then
    "$ALERT_SCRIPT" "Disk at ${usage}% on ${mount}"
    echo "$(date -Iseconds) WARN disk=${usage}% mount=${mount}" >> "$LOGFILE"
  fi
done

exit 0
