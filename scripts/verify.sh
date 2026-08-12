#!/usr/bin/env bash
#
# Runs every check CI runs, locally, in the same order.
#
# GitHub Actions is unavailable to this repo until 2026-09-01 (billing), which
# lands squarely on the run-up to Week 1. Without this, verifying a branch
# means remembering eight commands and standing up a Postgres by hand for the
# migration check — so in practice it means merging on hope.
#
# Keep this in step with .github/workflows/ci.yml. If a step is added there and
# not here, this script quietly stops being the thing it claims to be, so it
# checks for that too and warns.
#
# Usage:
#   npm run verify              # everything
#   npm run verify -- --fast    # skip build/bundle/smoke (~30s instead of ~2m)
set -uo pipefail

cd "$(dirname "$0")/.."

FAST=0
[ "${1:-}" = "--fast" ] && FAST=1

RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; DIM=$'\033[2m'; RESET=$'\033[0m'
FAILED=()
PASSED=0

run_step() {
  local label="$1"; shift
  printf '%-34s' "$label"
  local output
  if output=$("$@" 2>&1); then
    printf '%s\n' "${GREEN}ok${RESET}"
    PASSED=$((PASSED + 1))
  else
    printf '%s\n' "${RED}FAILED${RESET}"
    FAILED+=("$label")
    printf '%s\n' "$output" | tail -25 | sed "s/^/  ${DIM}|${RESET} /"
  fi
}

# --- Postgres for the migration check -------------------------------------
#
# Uses an already-running server if PGHOST/PGPORT point at one; otherwise
# stands up a throwaway cluster and tears it down on exit. The migration check
# is the one gate that cannot run without a real database, and it is also the
# one that caught a folder that had never been able to build a schema — so
# skipping it silently is not an option.
SCRATCH_PGDATA=""
cleanup() {
  if [ -n "$SCRATCH_PGDATA" ]; then
    pg_ctl -D "$SCRATCH_PGDATA" stop >/dev/null 2>&1 || true
    rm -rf "$SCRATCH_PGDATA"
  fi
}
trap cleanup EXIT

start_scratch_postgres() {
  for candidate in /opt/homebrew/opt/postgresql@16/bin /usr/local/opt/postgresql@16/bin; do
    [ -d "$candidate" ] && PATH="$candidate:$PATH"
  done
  export PATH
  command -v initdb >/dev/null 2>&1 || return 1

  SCRATCH_PGDATA="$(mktemp -d)/pgdata"
  # Postgres refuses to initialise under some locales on macOS.
  LC_ALL="en_US.UTF-8" initdb -D "$SCRATCH_PGDATA" -U postgres --auth=trust >/dev/null 2>&1 || return 1
  LC_ALL="en_US.UTF-8" pg_ctl -D "$SCRATCH_PGDATA" -o "-p 55499 -k /tmp" \
    -l "$SCRATCH_PGDATA/server.log" start >/dev/null 2>&1 || return 1

  for _ in $(seq 1 20); do
    pg_isready -h /tmp -p 55499 >/dev/null 2>&1 && break
    sleep 0.5
  done
  export PGHOST=/tmp PGPORT=55499 PGUSER=postgres
  return 0
}

echo
echo "Running the CI gate locally."
echo "${DIM}GitHub Actions is unavailable until 2026-09-01; this is the substitute.${RESET}"
echo

run_step "lint"             npm run lint
run_step "typecheck"        npm run typecheck
run_step "typecheck (edge)" npm run check:edge
run_step "tests"            npm run test:run

if [ "$FAST" -eq 0 ]; then
  run_step "build"          npm run build
  run_step "bundle budget"  npm run check:bundle
  run_step "route smoke"    npm run smoke:routes
else
  echo "${DIM}build / bundle budget / route smoke   skipped (--fast)${RESET}"
fi

printf '%-34s' "migrations from empty"
if [ -n "${PGHOST:-}" ] && pg_isready -q >/dev/null 2>&1; then
  : # caller supplied a server
elif ! start_scratch_postgres; then
  printf '%s\n' "${YELLOW}SKIPPED${RESET} (no local Postgres 16 — install with: brew install postgresql@16)"
  SKIPPED_MIGRATIONS=1
fi
if [ -z "${SKIPPED_MIGRATIONS:-}" ]; then
  if output=$(npm run check:migrations 2>&1); then
    printf '%s\n' "${GREEN}ok${RESET}"
    PASSED=$((PASSED + 1))
  else
    printf '%s\n' "${RED}FAILED${RESET}"
    FAILED+=("migrations from empty")
    printf '%s\n' "$output" | tail -25 | sed "s/^/  ${DIM}|${RESET} /"
  fi
fi

# --- Drift guard ----------------------------------------------------------
# If someone adds a step to CI and not here, this script silently stops being
# equivalent to it. Cheap to detect, so detect it.
ci_steps=$(grep -oE 'npm run [a-z:]+' .github/workflows/ci.yml | sort -u)
missing=""
while read -r step; do
  [ -z "$step" ] && continue
  grep -q -- "$step" "$0" || missing="$missing $step"
done <<< "$ci_steps"
if [ -n "$missing" ]; then
  echo
  echo "${YELLOW}warning:${RESET} in ci.yml but not run here:$missing"
  echo "${DIM}         this script is meant to be the full gate — please add them.${RESET}"
fi

echo
if [ ${#FAILED[@]} -eq 0 ]; then
  echo "${GREEN}All $PASSED checks passed.${RESET}"
  [ -n "${SKIPPED_MIGRATIONS:-}" ] && echo "${YELLOW}Note: the migration check did not run.${RESET}"
  exit 0
fi
echo "${RED}${#FAILED[@]} failed:${RESET} ${FAILED[*]}"
exit 1
