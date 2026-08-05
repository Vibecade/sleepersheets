#!/usr/bin/env bash
#
# Applies every migration, in order, to an empty database.
#
# This exists because the migration folder silently rotted for a year: nine
# tables — including every table that holds money — were created outside
# version control, and two migrations were byte-identical duplicates that
# aborted on the second run. The very first migration was an ALTER on a table
# defined nowhere, so `supabase db reset` had never once succeeded. Nothing
# caught it, because nothing ever tried.
#
# It also asserts the baseline is a no-op against a database that already has
# the tables. That property is what makes the baseline safe to apply to
# production, and it is easy to break by adding an unguarded statement.
#
# Requires a running Postgres. Set PGHOST/PGPORT/PGUSER, or let it default to
# the service GitHub Actions provides.
set -euo pipefail

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-postgres}"
export PGHOST PGPORT PGUSER PGPASSWORD

DB="migration_check_$$"
MIGRATIONS_DIR="$(cd "$(dirname "$0")/.." && pwd)/supabase/migrations"

cleanup() { psql -q -d postgres -c "DROP DATABASE IF EXISTS $DB;" >/dev/null 2>&1 || true; }
trap cleanup EXIT

psql -q -d postgres -c "CREATE DATABASE $DB;" >/dev/null

# The slice of the Supabase platform the migrations reference but don't
# create. On a real project these come with the hosted stack.
psql -q -d "$DB" -v ON_ERROR_STOP=1 >/dev/null <<'SQL'
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT,
  raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS
  $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS JSONB LANGUAGE sql STABLE AS
  $$ SELECT coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
-- Roles are cluster-wide, not per-database, so they survive between runs on
-- a reused server. Create them only if absent.
DO $$
DECLARE r TEXT;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('CREATE ROLE %I', r);
    END IF;
  END LOOP;
END $$;
CREATE PUBLICATION supabase_realtime;
SQL

applied=0
for file in "$MIGRATIONS_DIR"/*.sql; do
  if ! psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$file" >/dev/null 2>/tmp/migration_err.$$; then
    echo "FAILED: $(basename "$file")"
    sed -n '1,10p' "/tmp/migration_err.$$" >&2
    rm -f "/tmp/migration_err.$$"
    exit 1
  fi
  applied=$((applied + 1))
done
rm -f "/tmp/migration_err.$$"
echo "Applied $applied migrations to an empty database."

# The baseline must not touch a database that already has these tables —
# that is what lets it be applied to production safely.
snapshot() {
  psql -tA -d "$DB" -c "
    SELECT (SELECT count(*) FROM pg_policies WHERE schemaname='public')
        || ':' || (SELECT count(*) FROM information_schema.columns WHERE table_schema='public')
        || ':' || (SELECT count(*) FROM pg_indexes WHERE schemaname='public');"
}
before="$(snapshot)"
psql -q -d "$DB" -v ON_ERROR_STOP=1 -f "$MIGRATIONS_DIR"/00000000000000_baseline_schema.sql >/dev/null
after="$(snapshot)"

if [ "$before" != "$after" ]; then
  echo "FAILED: the baseline migration modified an existing database ($before -> $after)." >&2
  echo "Every statement in it must be guarded so re-applying is a no-op." >&2
  exit 1
fi
echo "Baseline re-applied as a no-op ($before unchanged)."
echo "Migration checks passed."
