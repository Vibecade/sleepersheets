-- Let automated writes be recorded in league_activities, and stop anyone else
-- writing to it.
--
-- `league_activities` has been dead schema since it was created: defined,
-- policied, and never read or written by a line of application code. It is
-- now the record of what the scheduled job did to a league's money while
-- nobody was watching, which means two things have to change first.
--
-- 1. THE ACTIVITY TYPES
--
-- The CHECK constraint allows only ('trade', 'waiver', 'comment',
-- 'announcement', 'contract_update'). An automated salary write is none of
-- those, and reusing 'waiver' would make an automated charge indistinguishable
-- from a human one in the very feed built to tell them apart.
--
-- 2. THE OPEN INSERT
--
-- The existing policy is `WITH CHECK (true)` — any authenticated caller can
-- insert an activity row for any league, including one they have nothing to do
-- with. That was harmless while nothing read the table. It stops being
-- harmless the moment a commissioner opens a feed and believes what it says,
-- because a stranger could put entries in it.
--
-- The only writer is the scheduled job, which uses the service-role key and
-- bypasses RLS, so it needs no policy at all. Dropping the permissive one
-- leaves the table readable by its league's owner and writable by nobody
-- through PostgREST. Verified no client code writes it: a repo-wide search for
-- `from('league_activities')` returns nothing outside the generated types.

ALTER TABLE public.league_activities
  DROP CONSTRAINT IF EXISTS league_activities_activity_type_check;

ALTER TABLE public.league_activities
  ADD CONSTRAINT league_activities_activity_type_check
  CHECK (activity_type IN (
    'trade',
    'waiver',
    'comment',
    'announcement',
    'contract_update',
    -- Written by the scheduled job. Distinct values so an automated write is
    -- never mistaken for something a person did.
    'automation_waiver_pricing',
    'automation_dead_cap'
  ));

DROP POLICY IF EXISTS "System can insert league activities" ON public.league_activities;

COMMENT ON TABLE public.league_activities IS
  'League event feed. Written only by the scheduled job via the service-role '
  'key; there are deliberately no INSERT policies, so entries cannot be forged '
  'through PostgREST. Readable by the league owner.';

CREATE INDEX IF NOT EXISTS idx_league_activities_league_recent
  ON public.league_activities (league_id, created_at DESC);
