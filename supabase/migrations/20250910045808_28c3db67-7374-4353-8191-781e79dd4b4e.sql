-- Remove contract records for players who have FAAB acquisition type
-- This ensures FAAB players don't have conflicting contract data
DELETE FROM player_contracts 
WHERE player_id IN (
  SELECT DISTINCT player_id 
  FROM player_salaries 
  WHERE acquisition_type = 'faab'
);