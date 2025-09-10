-- Fix existing FAAB acquisitions that weren't properly marked
-- This identifies players whose salaries match FAAB transaction amounts and marks them as FAAB acquisitions

WITH faab_transactions AS (
  SELECT 
    lt.league_id,
    jsonb_object_keys(lt.adds) as player_id,
    (lt.settings->>'waiver_bid')::numeric as faab_amount,
    lt.creator as roster_id
  FROM league_transactions lt
  WHERE lt.type = 'waiver' 
    AND lt.status = 'complete' 
    AND lt.settings ? 'waiver_bid'
    AND jsonb_typeof(lt.settings->'waiver_bid') = 'number'
),
matching_salaries AS (
  SELECT DISTINCT
    ps.id,
    ps.league_id,
    ps.player_id,
    ps.salary,
    ft.faab_amount
  FROM player_salaries ps
  JOIN faab_transactions ft ON ps.league_id = ft.league_id 
    AND ps.player_id = ft.player_id 
    AND ps.salary = ft.faab_amount
  WHERE ps.acquisition_type != 'faab'
)
UPDATE player_salaries 
SET 
  acquisition_type = 'faab',
  updated_at = now()
FROM matching_salaries ms
WHERE player_salaries.id = ms.id;

-- Log the changes made
SELECT 
  COUNT(*) as players_updated,
  league_id,
  'Updated to FAAB acquisition type' as change_description
FROM player_salaries 
WHERE acquisition_type = 'faab' 
  AND updated_at > now() - interval '1 minute'
GROUP BY league_id;