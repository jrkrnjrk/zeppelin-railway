#!/bin/sh
export NODE_ENV=production
export API_PATH_PREFIX="${API_PATH_PREFIX:-/api}"

if [ -n "$RAILWAY_PUBLIC_DOMAIN" ]; then
  export DASHBOARD_URL="${DASHBOARD_URL:-https://${RAILWAY_PUBLIC_DOMAIN}}"
  export API_URL="${API_URL:-https://${RAILWAY_PUBLIC_DOMAIN}/api}"
fi

echo "STAFF env=${STAFF:-<empty>}"
node /inject-staff-logs.js || echo "staff log inject failed"

PUBLIC_PORT="${PORT:-8080}"
echo "Starting proxy on $PUBLIC_PORT"
PORT="$PUBLIC_PORT" node /proxy.js &

echo "Running migrations..."
/zeppelin/entrypoint.sh migrate || echo "migrate failed, continuing"

echo "Starting api:3001 dashboard:3002 bot"
unset PORT
PORT=3001 /zeppelin/entrypoint.sh api &
PORT=3002 /zeppelin/entrypoint.sh dashboard &
/zeppelin/entrypoint.sh bot &

wait
