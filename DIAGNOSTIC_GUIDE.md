# Salary Cap & Contract Display Diagnostic Guide

## Changes Made

### 1. Fixed Salary Cap Calculation Performance Issue
**File:** `src/hooks/usePlayerSalaries.tsx`

**Problem:** The `getSalaryCapContribution` function was using inefficient `data.find()` lookup on every player, causing:
- O(n) performance instead of O(1)
- Race conditions where FAAB players weren't properly identified
- FAAB players incorrectly counting toward salary cap (e.g., $334 instead of $292)

**Solution:**
- Created `acquisitionTypes` state map for instant O(1) lookups
- Store acquisition type alongside salaries and taxi squad status
- Ensure acquisition types stay in sync when players are updated
- Added comprehensive console logging for debugging

### 2. Added Diagnostic Logging

**Files Modified:**
- `src/hooks/usePlayerSalaries.tsx` - Logs acquisition types and cap contributions
- `src/hooks/usePlayerContracts.tsx` - Logs contract loading
- `src/components/EditableContractLength.tsx` - Logs contract display
- `src/utils/salaryCalculations.ts` - Logs team salary calculations

## How to Debug Issues

### Check Salary Cap Calculations

When you load your league, open browser console (F12) and look for:

```
🧮 Recalculating optimized salary data for 12 teams
💰 Salary Cap: 200000
Loaded 150 players with acquisition types
FAAB players: 15

Player 12345: FAAB acquisition, $0 cap hit (salary: $42)
Player 67890: Full cap hit $50000
Player 11111: Taxi squad, $12500 cap hit (from $50000)

Team 1: 15 players, Active Salary: $292000
Team 1 Total: $292000 (Active: $292000 + Dead Cap: $0)
Team 1 Cap Status: 146.0% (over)
```

### Identify Misclassified FAAB Players

If you see a player with a salary but marked as FAAB showing a full cap hit:
```
Player 99999: Full cap hit $42  ⚠️ SHOULD BE $0 if FAAB!
```

This means the player's `acquisition_type` in the database is wrong.

### Check Contract Display

Look for contract logging:
```
✅ Contracts loaded for league abc123:
  totalContracts: 85
  withContracts: 62
  sampleContracts: [["12345", 3], ["67890", 2]]

📋 Contract display for 12345:
  currentLength: 3
  canModify: true
  isFAABPlayer: false
  rosterId: 1
```

If you don't see contracts loading, the issue is with data fetching.
If contracts load but don't display, the issue is with rendering.

## Common Issues & Solutions

### Issue: Team shows $334 instead of $292

**Diagnosis:**
1. Check console for player logs
2. Look for FAAB players showing "Full cap hit" instead of "$0 cap hit"
3. Count how many FAAB players are incorrectly counted

**Solution:**
The $42 difference ($334 - $292) suggests ~1-2 FAAB players are being counted.
Check database: These players have `acquisition_type = 'contract'` when they should be `'faab'`

### Issue: Contracts not visible on beta

**Diagnosis:**
1. Check console for "✅ Contracts loaded" message
2. If missing → Data not loading from database
3. If present → Check "📋 Contract display" messages
4. If no display messages → Component not rendering

**Possible Causes:**
- Database permissions issue (check RLS policies)
- Component conditionally hidden (check for feature flags)
- Parent component not passing props correctly
- Loading state stuck (check `contractsLoading` value)

### Issue: FAAB players showing contracts

**Expected Behavior:**
FAAB players should show "FAAB Player" label, not a contract field.

**Check:**
```javascript
// EditableContractLength.tsx line 60-65
if (isFAABPlayer) {
  return (
    <div className="flex items-center space-x-1 px-2 py-1 opacity-75">
      <span className="text-orange-400 text-sm">FAAB Player</span>
    </div>
  );
}
```

If this isn't working, `isPlayerFAABAcquisition()` is returning false when it should return true.

## Database Queries for Manual Debugging

### Find FAAB players incorrectly marked as contracts:

```sql
SELECT
  ps.league_id,
  ps.player_id,
  ps.salary,
  ps.acquisition_type,
  COUNT(pt.transaction_id) as faab_transactions
FROM player_salaries ps
LEFT JOIN processed_transactions pt ON ps.league_id = pt.league_id
  AND pt.player_updates::jsonb @> jsonb_build_array(jsonb_build_object('playerId', ps.player_id))
WHERE ps.acquisition_type != 'faab'
  AND pt.transaction_id IS NOT NULL
GROUP BY ps.league_id, ps.player_id, ps.salary, ps.acquisition_type;
```

### Fix misclassified FAAB players:

```sql
-- First, identify them from processed_transactions
WITH faab_player_ids AS (
  SELECT DISTINCT
    league_id,
    (jsonb_array_elements(player_updates::jsonb)->>'playerId')::text as player_id
  FROM processed_transactions
)
-- Then update their acquisition type
UPDATE player_salaries ps
SET acquisition_type = 'faab', updated_at = now()
FROM faab_player_ids fp
WHERE ps.league_id = fp.league_id
  AND ps.player_id = fp.player_id
  AND ps.acquisition_type != 'faab';
```

## Testing Checklist

After deploying fixes, verify:

- [ ] Console shows "Loaded X players with acquisition types"
- [ ] Console shows "FAAB players: Y" with correct count
- [ ] FAAB players log "$0 cap hit"
- [ ] Team totals match expected values
- [ ] Contracts display in DataDashboard
- [ ] Contracts display with edit icon when you own the league
- [ ] FAAB players show "FAAB Player" label instead of contract field
- [ ] Salary cap percentages are correct

## Next Steps

1. Deploy to beta
2. Open browser console and check logs
3. Load your league
4. Share console output to identify specific issue
5. If FAAB players are misclassified, run the fix query
6. Refresh and verify calculations are correct
