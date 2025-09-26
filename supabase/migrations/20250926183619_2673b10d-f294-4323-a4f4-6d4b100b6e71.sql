-- Create commissioner actions audit trail table
CREATE TABLE public.commissioner_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id TEXT NOT NULL,
  commissioner_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_type TEXT, -- 'user', 'transaction', 'setting', etc.
  target_id TEXT,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.commissioner_actions ENABLE ROW LEVEL SECURITY;

-- Create policies for commissioner actions
CREATE POLICY "League owners can view commissioner actions for their leagues" 
ON public.commissioner_actions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM league_ownership 
  WHERE league_ownership.league_id = commissioner_actions.league_id 
  AND league_ownership.user_id = auth.uid() 
  AND league_ownership.is_active = true
));

CREATE POLICY "League owners can create commissioner actions" 
ON public.commissioner_actions 
FOR INSERT 
WITH CHECK (
  auth.uid() = commissioner_id 
  AND EXISTS (
    SELECT 1 FROM league_ownership 
    WHERE league_ownership.league_id = commissioner_actions.league_id 
    AND league_ownership.user_id = auth.uid() 
    AND league_ownership.is_active = true
  )
);

-- Create transaction overrides table for manual adjustments
CREATE TABLE public.transaction_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  commissioner_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'approve', 'reject', 'reverse', 'modify'
  reason TEXT,
  original_data JSONB,
  modified_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.transaction_overrides ENABLE ROW LEVEL SECURITY;

-- Create policies for transaction overrides
CREATE POLICY "League owners can view transaction overrides for their leagues" 
ON public.transaction_overrides 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM league_ownership 
  WHERE league_ownership.league_id = transaction_overrides.league_id 
  AND league_ownership.user_id = auth.uid() 
  AND league_ownership.is_active = true
));

CREATE POLICY "League owners can create transaction overrides" 
ON public.transaction_overrides 
FOR INSERT 
WITH CHECK (
  auth.uid() = commissioner_id 
  AND EXISTS (
    SELECT 1 FROM league_ownership 
    WHERE league_ownership.league_id = transaction_overrides.league_id 
    AND league_ownership.user_id = auth.uid() 
    AND league_ownership.is_active = true
  )
);

-- Create league announcements table for official communications
CREATE TABLE public.league_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id TEXT NOT NULL,
  commissioner_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.league_announcements ENABLE ROW LEVEL SECURITY;

-- Create policies for league announcements
CREATE POLICY "Anyone can view active league announcements" 
ON public.league_announcements 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "League owners can manage league announcements" 
ON public.league_announcements 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM league_ownership 
  WHERE league_ownership.league_id = league_announcements.league_id 
  AND league_ownership.user_id = auth.uid() 
  AND league_ownership.is_active = true
))
WITH CHECK (
  auth.uid() = commissioner_id 
  AND EXISTS (
    SELECT 1 FROM league_ownership 
    WHERE league_ownership.league_id = league_announcements.league_id 
    AND league_ownership.user_id = auth.uid() 
    AND league_ownership.is_active = true
  )
);

-- Create trigger for updating announcement timestamps
CREATE TRIGGER update_league_announcements_updated_at
BEFORE UPDATE ON public.league_announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();