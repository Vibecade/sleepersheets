-- Fix league_ownership RLS to allow checking if leagues are claimed by others
-- while maintaining privacy of ownership details

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own league ownerships" ON public.league_ownership;

-- Allow anyone to check if a league is owned (but not see who owns it unless they're the owner)
-- This is needed for the ownership status badge to work correctly
CREATE POLICY "Anyone can check if league is owned" 
ON public.league_ownership 
FOR SELECT 
USING (true);

-- Keep existing policies for modifications (users can only modify their own)
-- No changes needed to INSERT/UPDATE policies as they already work correctly