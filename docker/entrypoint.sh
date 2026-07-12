#!/bin/sh
set -e

echo "Waiting for database..."
until nc -z postgres 5432; do
  sleep 1
done

echo "Database ready."

exec "$@"
