#!/usr/bin/env bash

set -euo pipefail

HOST="127.0.0.1"
PORT="${SMOKE_PORT:-4173}"
BASE_URL="http://${HOST}:${PORT}"
ROUTES=("/" "/auth" "/how-to" "/export" "/about" "/terms" "/privacy" "/cookies" "/this-route-should-404")

npx vite preview --host "${HOST}" --port "${PORT}" --strictPort >/tmp/sleepersheets-preview.log 2>&1 &
PREVIEW_PID=$!

cleanup() {
  if kill -0 "${PREVIEW_PID}" >/dev/null 2>&1; then
    kill "${PREVIEW_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl -fsS "${BASE_URL}/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

if ! curl -fsS "${BASE_URL}/" >/dev/null 2>&1; then
  echo "Route smoke check failed: preview server did not start."
  cat /tmp/sleepersheets-preview.log || true
  exit 1
fi

echo "Route smoke checks"
for route in "${ROUTES[@]}"; do
  output_file="/tmp/sleepersheets-smoke$(echo "${route}" | tr '/?' '__').html"
  status_code=$(curl -sS -o "${output_file}" -w "%{http_code}" "${BASE_URL}${route}")

  if [[ "${status_code}" != "200" ]]; then
    echo "- ${route}: failed with status ${status_code}"
    exit 1
  fi

  if ! grep -q 'id="root"' "${output_file}"; then
    echo "- ${route}: missing app root marker"
    exit 1
  fi

  echo "- ${route}: ok"
done

echo "Route smoke checks passed."
