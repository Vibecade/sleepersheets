import { describe, it, expect } from 'vitest';
import { createDemoLeagueData, isDemoLeagueId, DEMO_LEAGUE_ID } from './demoData';
import { validateLeagueId } from './inputValidation';
import { describeLeagueWeek } from './nflWeek';

describe('isDemoLeagueId', () => {
  it('recognises the demo league', () => {
    expect(isDemoLeagueId(DEMO_LEAGUE_ID)).toBe(true);
  });

  it('rejects real Sleeper ids, empties and nullish input', () => {
    expect(isDemoLeagueId('123456789012345678')).toBe(false);
    expect(isDemoLeagueId('')).toBe(false);
    expect(isDemoLeagueId(undefined)).toBe(false);
    expect(isDemoLeagueId(null)).toBe(false);
  });

  it('is why the demo needs an exception at all', () => {
    // Documents the root cause: the demo id can never pass ID validation,
    // so every path that validates has to opt out explicitly.
    expect(validateLeagueId(DEMO_LEAGUE_ID).isValid).toBe(false);
  });
});

describe('demo league data', () => {
  const { league, rosters } = createDemoLeagueData();

  it('reports a team count matching the rosters it ships', () => {
    // The header renders total_rosters directly. Omitting it printed
    // "TEAMS 0"; a mismatched count would contradict the roster cards.
    expect(league.total_rosters).toBe(rosters.length);
    expect(league.settings?.num_teams).toBe(rosters.length);
  });

  it('has rosters with unique ids', () => {
    const ids = rosters.map((roster) => roster.roster_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('sits in the regular season, so the header reads sensibly', () => {
    const described = describeLeagueWeek(league);
    expect(described.isPreseason).toBe(false);
    expect(described.label).toBe('WEEK 14 OF 14');
  });

  it('every roster belongs to the demo league', () => {
    for (const roster of rosters) {
      expect(roster.league_id).toBe(DEMO_LEAGUE_ID);
    }
  });
});
