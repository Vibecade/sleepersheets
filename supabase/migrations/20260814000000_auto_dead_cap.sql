-- Opt-in for automated dead cap.
--
-- Separate from auto_waiver_pricing on purpose. The two write different data
-- for different reasons, and a commissioner may reasonably want their waiver
-- claims priced automatically while still deciding dead cap penalties by
-- hand — dead cap is a league-rules judgement in a way that "price this claim
-- at the bid that won it" is not.
--
-- Off by default, like everything else here. `paused_at` still overrides it.

ALTER TABLE public.league_automation_settings
  ADD COLUMN IF NOT EXISTS auto_dead_cap BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.league_automation_settings.auto_dead_cap IS
  'Charge dead cap automatically when a player under salary is dropped. '
  'Rows are written to dead_cap_players holding the undiscounted salary; the '
  'cap engine applies the penalty percentage when reading.';
