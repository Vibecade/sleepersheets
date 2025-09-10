-- Fix FAAB classification issue for existing data
-- Team defenses (like LAR, MIN) are commonly acquired via FAAB and should not count toward salary cap

-- First, let's identify and fix team defenses that should be FAAB acquisitions
-- Team defenses typically have player_ids that are team abbreviations
UPDATE player_salaries 
SET acquisition_type = 'faab'
WHERE acquisition_type = 'contract' 
  AND (
    -- Team defense abbreviations (common ones)
    player_id IN ('LAR', 'MIN', 'KC', 'BUF', 'PHI', 'SF', 'DAL', 'MIA', 'BAL', 'CIN', 
                  'JAX', 'TEN', 'IND', 'HOU', 'CLE', 'PIT', 'DEN', 'LV', 'LAC', 'NYJ',
                  'NE', 'GB', 'CHI', 'DET', 'TB', 'NO', 'ATL', 'CAR', 'WAS', 'NYG',
                  'SEA', 'ARI', 'LAC')
    -- Or player_ids that look like team abbreviations (2-3 letter codes)
    OR (LENGTH(player_id) <= 3 AND player_id ~ '^[A-Z]+$')
  );

-- Remove any contract records for players with FAAB acquisition type
DELETE FROM player_contracts 
WHERE player_id IN (
  SELECT DISTINCT player_id 
  FROM player_salaries 
  WHERE acquisition_type = 'faab'
);

-- Log the changes made
DO $$
DECLARE
    faab_count integer;
    contract_count integer;
BEGIN
    SELECT COUNT(*) INTO faab_count FROM player_salaries WHERE acquisition_type = 'faab';
    SELECT COUNT(*) INTO contract_count FROM player_contracts;
    
    RAISE NOTICE 'FAAB classification fix completed. FAAB players: %, Contract records: %', faab_count, contract_count;
END $$;