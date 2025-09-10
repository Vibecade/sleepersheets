-- Create table to track processed transactions
CREATE TABLE public.processed_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  player_updates JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(league_id, transaction_id)
);

-- Enable Row Level Security
ALTER TABLE public.processed_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view processed transactions" 
ON public.processed_transactions 
FOR SELECT 
USING (true);

CREATE POLICY "Only league owners can modify processed transactions" 
ON public.processed_transactions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM league_ownership 
  WHERE league_ownership.league_id = processed_transactions.league_id 
  AND league_ownership.user_id = auth.uid() 
  AND league_ownership.is_active = true
))
WITH CHECK (EXISTS (
  SELECT 1 FROM league_ownership 
  WHERE league_ownership.league_id = processed_transactions.league_id 
  AND league_ownership.user_id = auth.uid() 
  AND league_ownership.is_active = true
));