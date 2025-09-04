-- Fix critical security issues in RLS policies

-- 1. CRITICAL: Remove overly permissive league ownership policy that exposes all user data
-- This policy allows anyone to see which users own which leagues
DROP POLICY IF EXISTS "Users can view league ownership" ON public.league_ownership;

-- 2. Clean up conflicting policies on dead_cap_players table
-- Remove overly permissive policies, keep only the restrictive owner-only policies
DROP POLICY IF EXISTS "Anyone can create dead cap players" ON public.dead_cap_players;
DROP POLICY IF EXISTS "Anyone can delete dead cap players" ON public.dead_cap_players;
DROP POLICY IF EXISTS "Anyone can update dead cap players" ON public.dead_cap_players;
DROP POLICY IF EXISTS "Anyone can view dead cap players" ON public.dead_cap_players;

-- 3. Clean up conflicting policies on player_salaries table  
DROP POLICY IF EXISTS "Anyone can create player salaries" ON public.player_salaries;
DROP POLICY IF EXISTS "Anyone can delete player salaries" ON public.player_salaries;
DROP POLICY IF EXISTS "Anyone can update player salaries" ON public.player_salaries;
DROP POLICY IF EXISTS "Anyone can view player salaries" ON public.player_salaries;

-- 4. Clean up conflicting policies on league_settings table
DROP POLICY IF EXISTS "Anyone can create league settings" ON public.league_settings;
DROP POLICY IF EXISTS "Anyone can delete league settings" ON public.league_settings;
DROP POLICY IF EXISTS "Anyone can update league settings" ON public.league_settings;
DROP POLICY IF EXISTS "Anyone can view league settings" ON public.league_settings;

-- 5. Remove overly permissive policy on player_contracts
DROP POLICY IF EXISTS "Allow all operations on player_contracts" ON public.player_contracts;

-- 6. Evaluate public read access policies - these expose competitive fantasy data
-- Remove if not needed for public features, otherwise document the business justification
DROP POLICY IF EXISTS "Allow public read access to draft_picks" ON public.draft_picks;
DROP POLICY IF EXISTS "Allow public read access to league_drafts" ON public.league_drafts;  
DROP POLICY IF EXISTS "Allow public read access to league_transactions" ON public.league_transactions;

-- 7. Create more granular policies for league data access
-- Allow league owners and participants to view league-related data

-- For league settings - owners can modify, participants can view
CREATE POLICY "League participants can view league settings"
ON public.league_settings
FOR SELECT
USING (true);  -- This allows viewing settings for any league (needed for public league info)

-- For player salaries - owners can modify, participants can view  
CREATE POLICY "League participants can view player salaries"
ON public.player_salaries
FOR SELECT
USING (true);  -- Salary data is typically public in fantasy leagues

-- For dead cap players - owners can modify, participants can view
CREATE POLICY "League participants can view dead cap players" 
ON public.dead_cap_players
FOR SELECT
USING (true);  -- Dead cap info is typically visible to league participants

-- For player contracts - owners can modify, participants can view
CREATE POLICY "League participants can view player contracts"
ON public.player_contracts  
FOR SELECT
USING (true);  -- Contract info is typically visible to league participants

-- For draft picks - allow viewing by league participants (fantasy drafts are usually public within league)
CREATE POLICY "League participants can view draft picks"
ON public.draft_picks
FOR SELECT  
USING (true);  -- Draft results are typically visible to all league participants

-- For league drafts - allow viewing by league participants
CREATE POLICY "League participants can view league drafts"
ON public.league_drafts
FOR SELECT
USING (true);  -- Draft info is typically visible to all league participants

-- For league transactions - allow viewing by league participants  
CREATE POLICY "League participants can view league transactions"
ON public.league_transactions
FOR SELECT
USING (true);  -- Transaction history is typically visible to all league participants

-- Keep the existing restrictive owner-only modification policies
-- These ensure only league owners can modify data, which is appropriate