-- Fix league_settings RLS policies to allow proper FAAB functionality
-- while maintaining security for modifications

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view league settings" ON public.league_settings;
DROP POLICY IF EXISTS "Only league owners can modify settings" ON public.league_settings;

-- Allow anyone to read league settings (needed for FAAB calculations)
CREATE POLICY "Anyone can view league settings" 
ON public.league_settings 
FOR SELECT 
USING (true);

-- Allow creation of default settings for any league (needed for initial setup)
CREATE POLICY "Allow creation of default league settings" 
ON public.league_settings 
FOR INSERT 
WITH CHECK (true);

-- Only allow league owners to update existing settings
CREATE POLICY "Only league owners can update settings" 
ON public.league_settings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1
    FROM league_ownership
    WHERE league_ownership.league_id = league_settings.league_id 
    AND league_ownership.user_id = auth.uid() 
    AND league_ownership.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM league_ownership
    WHERE league_ownership.league_id = league_settings.league_id 
    AND league_ownership.user_id = auth.uid() 
    AND league_ownership.is_active = true
  )
);

-- Prevent deletion of league settings (data integrity)
CREATE POLICY "Prevent deletion of league settings" 
ON public.league_settings 
FOR DELETE 
USING (false);