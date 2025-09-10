-- Create league metadata table for caching
CREATE TABLE public.league_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id TEXT NOT NULL UNIQUE,
  name TEXT,
  season TEXT,
  season_type TEXT,
  sport TEXT,
  total_rosters INTEGER,
  scoring_settings JSONB,
  roster_positions JSONB,
  sleeper_verified_at TIMESTAMP WITH TIME ZONE,
  last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create data integrity log table
CREATE TABLE public.data_integrity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  operation_type TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  violation_type TEXT NOT NULL, -- 'league_not_found', 'duplicate_data', 'rls_violation'
  details JSONB,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create function to validate league exists in Sleeper API
CREATE OR REPLACE FUNCTION public.validate_league_exists(league_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  metadata_exists BOOLEAN;
  last_verified TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if we have recent verification (within 24 hours)
  SELECT 
    sleeper_verified_at IS NOT NULL AND sleeper_verified_at > (now() - INTERVAL '24 hours'),
    sleeper_verified_at
  INTO metadata_exists, last_verified
  FROM public.league_metadata 
  WHERE league_id = league_id_param;
  
  -- If we have recent verification, trust it
  IF metadata_exists THEN
    RETURN TRUE;
  END IF;
  
  -- For new leagues or old verifications, we'll assume valid for now
  -- This function can be enhanced to make actual API calls via edge functions
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log data integrity violations
CREATE OR REPLACE FUNCTION public.log_integrity_violation(
  league_id_param TEXT,
  table_name_param TEXT,
  operation_type_param TEXT,
  violation_type_param TEXT,
  details_param JSONB DEFAULT NULL,
  user_id_param UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.data_integrity_logs (
    league_id,
    table_name,
    operation_type,
    violation_type,
    details,
    user_id
  ) VALUES (
    league_id_param,
    table_name_param,
    operation_type_param,
    violation_type_param,
    details_param,
    COALESCE(user_id_param, auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for league validation
CREATE OR REPLACE FUNCTION public.validate_league_before_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate league exists
  IF NOT public.validate_league_exists(NEW.league_id) THEN
    PERFORM public.log_integrity_violation(
      NEW.league_id,
      TG_TABLE_NAME,
      TG_OP,
      'league_not_found',
      jsonb_build_object('attempted_league_id', NEW.league_id)
    );
    RAISE EXCEPTION 'League ID % not found in Sleeper API', NEW.league_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to validate league_id on all relevant tables
CREATE TRIGGER validate_league_player_salaries
  BEFORE INSERT ON public.player_salaries
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_league_before_insert();

CREATE TRIGGER validate_league_player_contracts
  BEFORE INSERT ON public.player_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_league_before_insert();

CREATE TRIGGER validate_league_dead_cap_players
  BEFORE INSERT ON public.dead_cap_players
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_league_before_insert();

CREATE TRIGGER validate_league_transactions
  BEFORE INSERT ON public.league_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_league_before_insert();

CREATE TRIGGER validate_league_drafts
  BEFORE INSERT ON public.league_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_league_before_insert();

CREATE TRIGGER validate_league_settings
  BEFORE INSERT ON public.league_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_league_before_insert();

-- Enable RLS on new tables
ALTER TABLE public.league_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_integrity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for league_metadata
CREATE POLICY "Anyone can view league metadata" 
ON public.league_metadata FOR SELECT 
USING (true);

CREATE POLICY "Only league owners can modify league metadata" 
ON public.league_metadata FOR ALL 
USING (EXISTS (
  SELECT 1 FROM league_ownership 
  WHERE league_ownership.league_id = league_metadata.league_id 
  AND league_ownership.user_id = auth.uid() 
  AND league_ownership.is_active = true
))
WITH CHECK (EXISTS (
  SELECT 1 FROM league_ownership 
  WHERE league_ownership.league_id = league_metadata.league_id 
  AND league_ownership.user_id = auth.uid() 
  AND league_ownership.is_active = true
));

-- Create RLS policies for data_integrity_logs
CREATE POLICY "Anyone can view integrity logs" 
ON public.data_integrity_logs FOR SELECT 
USING (true);

CREATE POLICY "System can insert integrity logs" 
ON public.data_integrity_logs FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_league_metadata_league_id ON public.league_metadata(league_id);
CREATE INDEX idx_league_metadata_last_synced ON public.league_metadata(last_synced_at);
CREATE INDEX idx_data_integrity_logs_league_id ON public.data_integrity_logs(league_id);
CREATE INDEX idx_data_integrity_logs_created_at ON public.data_integrity_logs(created_at);
CREATE INDEX idx_data_integrity_logs_violation_type ON public.data_integrity_logs(violation_type);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add timestamp triggers
CREATE TRIGGER update_league_metadata_updated_at
  BEFORE UPDATE ON public.league_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();