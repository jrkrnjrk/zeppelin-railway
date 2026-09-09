#!/bin/sh
export NODE_ENV=production
export API_PATH_PREFIX="${API_PATH_PREFIX:-/api}"

if [ -n "$RAILWAY_PUBLIC_DOMAIN" ]; then
  export DASHBOARD_URL="${DASHBOARD_URL:-https://${RAILWAY_PUBLIC_DOMAIN}}"
  export API_URL="${API_URL:-https://${RAILWAY_PUBLIC_DOMAIN}/api}"
fi

echo "Starting proxy first so Railway sees a port"
node /proxy.js &

echo "Running migrations..."
/zeppelin/entrypoint.sh migrate || echo "migrate failed, continuing"

echo "Starting api, dashboard, bot"
/zeppelin/entrypoint.sh api &
/zeppelin/entrypoint.sh dashboard &
/zeppelin/entrypoint.sh bot &

wait
