-- Persist weekly gamification quest snapshots per league
CREATE TABLE public.gamification_quest_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id TEXT NOT NULL,
  season TEXT NOT NULL,
  week INTEGER NOT NULL CHECK (week >= 1 AND week <= 22),
  snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  quest_points INTEGER NOT NULL DEFAULT 0 CHECK (quest_points >= 0),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (league_id, season, week)
);

ALTER TABLE public.gamification_quest_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quest snapshots"
ON public.gamification_quest_snapshots
FOR SELECT
USING (true);

CREATE POLICY "League owners can manage quest snapshots"
ON public.gamification_quest_snapshots
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.league_ownership
    WHERE league_ownership.league_id = gamification_quest_snapshots.league_id
      AND league_ownership.user_id = auth.uid()
      AND league_ownership.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.league_ownership
    WHERE league_ownership.league_id = gamification_quest_snapshots.league_id
      AND league_ownership.user_id = auth.uid()
      AND league_ownership.is_active = true
  )
);

CREATE TRIGGER validate_league_gamification_quest_snapshots
BEFORE INSERT ON public.gamification_quest_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.validate_league_before_insert();

CREATE TRIGGER update_gamification_quest_snapshots_updated_at
BEFORE UPDATE ON public.gamification_quest_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_gamification_quest_snapshots_lookup
ON public.gamification_quest_snapshots (league_id, season, week DESC);
