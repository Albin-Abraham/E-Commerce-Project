#!/bin/sh
# =============================================================================
# Container entrypoint
# =============================================================================
# 1. Regenerates env.js so the browser can read a small set of runtime values.
# 2. Substitutes the backend upstream into the nginx config.
#
# Two rules this script must uphold:
#   - `set -e`: a failed write must abort the container, not silently boot an
#     app with no configuration.
#   - Only non-empty values are emitted. ViteEnvProvider resolves with `??`,
#     which treats an empty string as a real value, so writing
#     `VITE_API_URL: ""` would shadow a correct build-time value and trip the
#     "Missing VITE_API_URL" guard in axios.env.runtime.ts.
set -e

if [ -z "$BACKEND_HOST" ] || [ -z "$BACKEND_PORT" ]; then
  echo "[entrypoint] FATAL: BACKEND_HOST and BACKEND_PORT must be set." >&2
  echo "[entrypoint]   docker/docker-compose.yml supplies defaults; override via" >&2
  echo "[entrypoint]   docker compose -f docker/docker-compose.yml \\" >&2
  echo "[entrypoint]     --env-file .env.docker up -d" >&2
  exit 1
fi

ENV_JS=/usr/share/nginx/html/env.js

{
  echo "window.__ENV__ = window.__ENV__ || {};"
  if [ -n "$VITE_API_URL" ]; then
    echo "window.__ENV__['VITE_API_URL'] = '$VITE_API_URL';"
  fi
  if [ -n "$API_URL" ]; then
    echo "window.__ENV__['API_URL'] = '$API_URL';"
  fi
  if [ -n "$VITE_APP_ENV" ]; then
    echo "window.__ENV__['VITE_APP_ENV'] = '$VITE_APP_ENV';"
  fi
} > "$ENV_JS"

echo "[entrypoint] env.js generated:"
sed 's/^/[entrypoint]   /' "$ENV_JS"

# Substitute the backend upstream. The variable list is explicit so that nginx
# runtime variables ($host, $uri, $remote_addr, ...) survive envsubst intact.
envsubst '$BACKEND_HOST $BACKEND_PORT' \
  < /etc/nginx/templates/nginx.conf.template \
  > /etc/nginx/conf.d/default.conf

echo "[entrypoint] nginx upstream -> ${BACKEND_HOST}:${BACKEND_PORT}"

# This entrypoint replaces the base image's /docker-entrypoint.sh, so the image
# helper scripts never run. Re-invoke the worker autotuner, which patches
# nginx.conf to a worker count matching CONTAINER_CPU_LIMIT. (The IPv6 helper is
# not re-invoked: it only rewrites the *packaged* default.conf and bails out on
# anything else, including the config we generate here. The container therefore
# listens on IPv4 only, which is why the healthcheck must target 127.0.0.1.)
if [ -x /docker-entrypoint.d/30-tune-worker-processes.sh ]; then
  /docker-entrypoint.d/30-tune-worker-processes.sh \
    || echo "[entrypoint] warning: worker autotune failed, continuing" >&2
fi

exec "$@"
