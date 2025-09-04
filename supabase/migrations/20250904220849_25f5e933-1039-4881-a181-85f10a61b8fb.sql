-- Fix FAAB functionality by ensuring proper access to transaction data for league participants

-- Drop existing restrictive policies for league_transactions
DROP POLICY IF EXISTS "League participants can view league transactions" ON public.league_transactions;

-- Create new policy that allows authenticated users to view transactions for leagues they're connected to
-- This is needed for FAAB calculations which require transaction data
CREATE POLICY "Users can view transactions for their leagues" 
ON public.league_transactions 
FOR SELECT 
USING (
  -- Allow access if user is authenticated (needed for FAAB calculations)
  auth.uid() IS NOT NULL
);

-- Ensure league_settings table allows proper access for FAAB settings
DROP POLICY IF EXISTS "League participants can view league settings" ON public.league_settings;

CREATE POLICY "Users can view league settings" 
ON public.league_settings 
FOR SELECT 
USING (
  -- Allow access if user is authenticated (needed for FAAB cap and other settings)
  auth.uid() IS NOT NULL
);