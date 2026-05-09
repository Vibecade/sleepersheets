/**
 * Pure CSV row builders for league exports.
 *
 * Each function takes everything it needs as input and returns a flat
 * `string[][]` (header + data rows). They write spreadsheet-safe values:
 * raw numbers (no `$`), ISO 8601 dates, `TRUE`/`FALSE` booleans. The
 * downloadCSV helper handles quoting/escaping at write time.
 *
 * These builders back both the per-domain Export buttons (Rosters,
 * Standings, etc.) and the consolidated ZIP export, so the data shape
 * is consistent across all download paths.
 */
import {
  formatPlayerName,
  formatCurrencyRaw,
  formatDateISO,
  formatBoolRaw,
  getPlayerFranchiseValueRaw,
  getDataTimestamp,
} from '@/utils/csvExport';
import { getTeamName } from '@/utils/leagueDataUtils';

// -- Shared helpers ---------------------------------------------------------

const num = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : '';
};

const fixed = (v: unknown, digits = 2): string => {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(digits) : '';
};

const winPct = (wins: number, losses: number, ties: number): string => {
  const games = wins + losses + ties;
  if (games <= 0) return '';
  return ((wins + ties * 0.5) / games).toFixed(4);
};

const transactionTypeLabel = (raw: string | undefined): string => {
  const types: Record<string, string> = {
    waiver: 'waiver',
    free_agent: 'free_agent',
    trade: 'trade',
    commissioner: 'commissioner',
    taxi: 'taxi',
  };
  return types[raw || ''] || raw || 'unknown';
};

// -- League info ------------------------------------------------------------

export interface BuildLeagueInfoArgs {
  league: any;
  rosters: any[];
  dbSettings?: {
    salary_cap?: number;
    faab_cap?: number;
    dead_cap_enabled?: boolean;
    reserve_limit?: number | null;
  } | null;
}

export const buildLeagueInfoCsv = ({
  league,
  rosters,
  dbSettings,
}: BuildLeagueInfoArgs): string[][] => {
  const rows: string[][] = [['Setting', 'Value']];
  rows.push(['league_name', String(league?.name ?? '')]);
  rows.push(['league_id', String(league?.league_id ?? '')]);
  rows.push(['season', String(league?.season ?? '')]);
  rows.push(['sport', String(league?.sport ?? 'nfl')]);
  rows.push(['total_teams', num(league?.total_rosters ?? rosters.length)]);
  rows.push([
    'league_type',
    league?.settings?.type === 2
      ? 'dynasty'
      : league?.settings?.type === 1
      ? 'keeper'
      : 'redraft',
  ]);
  rows.push(['status', String(league?.status ?? '')]);
  rows.push(['current_week', num(league?.settings?.leg ?? league?.settings?.week)]);
  rows.push(['playoff_week_start', num(league?.settings?.playoff_week_start)]);
  rows.push(['playoff_teams', num(league?.settings?.playoff_teams)]);

  if (dbSettings) {
    rows.push(['salary_cap', num(dbSettings.salary_cap ?? 200000)]);
    rows.push(['faab_cap', num(dbSettings.faab_cap ?? 100)]);
    rows.push(['dead_cap_enabled', formatBoolRaw(!!dbSettings.dead_cap_enabled)]);
    if (dbSettings.reserve_limit !== null && dbSettings.reserve_limit !== undefined) {
      rows.push(['reserve_limit', num(dbSettings.reserve_limit)]);
    }
  }

  return rows;
};

// -- Scoring & roster positions --------------------------------------------

export const buildScoringSettingsCsv = (league: any): string[][] => {
  const rows: string[][] = [['scoring_key', 'points']];
  const scoring = league?.scoring_settings;
  if (!scoring) return rows;
  Object.entries(scoring).forEach(([key, value]) => {
    rows.push([key, num(value)]);
  });
  return rows;
};

export const buildRosterPositionsCsv = (league: any): string[][] => {
  const rows: string[][] = [['position', 'count']];
  const positions = league?.roster_positions;
  if (!Array.isArray(positions)) return rows;
  const counts: Record<string, number> = {};
  positions.forEach((pos: string) => {
    counts[pos] = (counts[pos] || 0) + 1;
  });
  Object.entries(counts).forEach(([pos, count]) => {
    rows.push([pos, num(count)]);
  });
  return rows;
};

// -- Standings --------------------------------------------------------------

export interface BuildStandingsArgs {
  rosters: any[];
  userMap: Record<string, any>;
}

export const buildStandingsCsv = ({
  rosters,
  userMap,
}: BuildStandingsArgs): string[][] => {
  const rows: string[][] = [
    [
      'rank',
      'team_name',
      'owner',
      'wins',
      'losses',
      'ties',
      'win_pct',
      'points_for',
      'points_against',
      'point_differential',
      'streak',
    ],
  ];

  const sorted = [...rosters].sort((a, b) => {
    const aw = a.settings?.wins || 0;
    const bw = b.settings?.wins || 0;
    const aPct = aw / Math.max(1, aw + (a.settings?.losses || 0));
    const bPct = bw / Math.max(1, bw + (b.settings?.losses || 0));
    if (aPct !== bPct) return bPct - aPct;
    return (b.settings?.fpts || 0) - (a.settings?.fpts || 0);
  });

  sorted.forEach((roster, index) => {
    const user = userMap[roster.owner_id];
    const wins = Number(roster.settings?.wins || 0);
    const losses = Number(roster.settings?.losses || 0);
    const ties = Number(roster.settings?.ties || 0);
    const pf = Number(roster.settings?.fpts || 0);
    const pa = Number(roster.settings?.fpts_against || 0);
    rows.push([
      String(index + 1),
      getTeamName(user),
      user?.display_name || user?.username || '',
      String(wins),
      String(losses),
      String(ties),
      winPct(wins, losses, ties),
      fixed(pf),
      fixed(pa),
      fixed(pf - pa),
      String(roster.settings?.streak || ''),
    ]);
  });

  return rows;
};

// -- Team summary (standings + financial) ----------------------------------

export interface BuildTeamSummaryArgs {
  rosters: any[];
  userMap: Record<string, any>;
  salaryCap: number;
  deadCapPlayers: Array<{ roster_id: number; salary?: number }>;
  getSalaryCapContribution: (playerId: string) => number;
  teamFAAB: Record<number, { spent?: number; available?: number }>;
}

export const buildTeamSummaryCsv = ({
  rosters,
  userMap,
  salaryCap,
  deadCapPlayers,
  getSalaryCapContribution,
  teamFAAB,
}: BuildTeamSummaryArgs): string[][] => {
  const rows: string[][] = [
    [
      'rank',
      'team_name',
      'owner',
      'wins',
      'losses',
      'ties',
      'win_pct',
      'points_for',
      'points_against',
      'total_salary',
      'cap_space',
      'faab_spent',
      'faab_remaining',
    ],
  ];

  const sorted = [...rosters].sort((a, b) => {
    const aw = a.settings?.wins || 0;
    const bw = b.settings?.wins || 0;
    const aPct = aw / Math.max(1, aw + (a.settings?.losses || 0));
    const bPct = bw / Math.max(1, bw + (b.settings?.losses || 0));
    if (aPct !== bPct) return bPct - aPct;
    return (b.settings?.fpts || 0) - (a.settings?.fpts || 0);
  });

  sorted.forEach((roster, index) => {
    const user = userMap[roster.owner_id];
    const wins = Number(roster.settings?.wins || 0);
    const losses = Number(roster.settings?.losses || 0);
    const ties = Number(roster.settings?.ties || 0);
    const pf = Number(roster.settings?.fpts || 0);
    const pa = Number(roster.settings?.fpts_against || 0);

    const allPlayerIds = [
      ...((roster.players as string[]) || []),
      ...((roster.taxi as string[]) || []),
    ];
    const totalSalary = allPlayerIds.reduce(
      (acc, playerId) => acc + getSalaryCapContribution(playerId),
      0,
    );
    const deadCap = deadCapPlayers
      .filter((p) => p.roster_id === roster.roster_id)
      .reduce((acc, p) => acc + Math.max(1, Math.round((p.salary || 0) * 0.25)), 0);
    const totalWithDeadCap = totalSalary + deadCap;
    const capSpace = salaryCap - totalWithDeadCap;

    const faab = teamFAAB[roster.roster_id] || { spent: 0, available: 0 };

    rows.push([
      String(index + 1),
      getTeamName(user),
      user?.display_name || user?.username || '',
      String(wins),
      String(losses),
      String(ties),
      winPct(wins, losses, ties),
      fixed(pf),
      fixed(pa),
      formatCurrencyRaw(totalWithDeadCap),
      formatCurrencyRaw(capSpace),
      formatCurrencyRaw(faab.spent || 0),
      formatCurrencyRaw(faab.available || 0),
    ]);
  });

  return rows;
};

// -- Rosters ----------------------------------------------------------------

export interface BuildRostersArgs {
  rosters: any[];
  userMap: Record<string, any>;
  players: Record<string, any>;
  salaries?: Record<string, number>;
  contracts?: Record<string, number>;
  deadCapPlayers?: Array<{ roster_id: number; player_id: string; salary?: number }>;
  taxiSquadStatus?: Record<string, boolean>;
  getSalaryCapContribution?: (playerId: string) => number;
  getPlayerFAABCost?: (playerId: string, rosterId: number) => number;
}

export const buildRostersCsv = ({
  rosters,
  userMap,
  players,
  salaries = {},
  contracts = {},
  deadCapPlayers = [],
  taxiSquadStatus = {},
  getSalaryCapContribution,
  getPlayerFAABCost,
}: BuildRostersArgs): string[][] => {
  const rows: string[][] = [
    [
      'team_name',
      'player_name',
      'nfl_team',
      'position',
      'roster_status',
      'salary',
      'is_taxi',
      'taxi_discount',
      'cap_hit',
      'contract_years',
      'acquisition_type',
      'faab_cost',
      'franchise_value',
    ],
  ];

  rosters.forEach((roster) => {
    const user = userMap[roster.owner_id];
    const team = getTeamName(user);

    const categories: Array<{ list: string[]; status: string }> = [
      { list: roster.players || [], status: 'active' },
      { list: roster.reserve || [], status: 'reserve' },
      { list: roster.taxi || [], status: 'taxi' },
    ];

    categories.forEach(({ list, status }) => {
      list.forEach((playerId) => {
        const player = players[playerId];
        if (!player) return;
        const salary = salaries[playerId] || 0;
        const isTaxi = !!taxiSquadStatus[playerId] || status === 'taxi';
        const taxiDiscount = isTaxi ? Math.round(salary * 0.25) : 0;
        const capHit = getSalaryCapContribution
          ? getSalaryCapContribution(playerId)
          : salary;
        const faabCost = getPlayerFAABCost
          ? getPlayerFAABCost(playerId, roster.roster_id)
          : 0;
        const acquisitionType = faabCost > 0 ? 'faab' : 'contract';

        rows.push([
          team,
          formatPlayerName(player),
          String(player.team || 'FA'),
          String(player.position || ''),
          status,
          formatCurrencyRaw(salary),
          formatBoolRaw(isTaxi),
          formatCurrencyRaw(taxiDiscount),
          formatCurrencyRaw(capHit),
          contracts[playerId] ? num(contracts[playerId]) : '',
          acquisitionType,
          formatCurrencyRaw(faabCost),
          getPlayerFranchiseValueRaw(player),
        ]);
      });
    });
  });

  // Dead cap players appear as their own roster_status=dead_cap rows
  deadCapPlayers.forEach((entry) => {
    const player = players[entry.player_id];
    const roster = rosters.find((r) => r.roster_id === entry.roster_id);
    const user = roster ? userMap[roster.owner_id] : null;
    const team = user ? getTeamName(user) : '';
    rows.push([
      team,
      player ? formatPlayerName(player) : `player:${entry.player_id}`,
      String(player?.team || 'FA'),
      String(player?.position || ''),
      'dead_cap',
      formatCurrencyRaw(entry.salary || 0),
      formatBoolRaw(false),
      '',
      formatCurrencyRaw(Math.max(1, Math.round((entry.salary || 0) * 0.25))),
      '',
      'dead_cap',
      '',
      player ? getPlayerFranchiseValueRaw(player) : '',
    ]);
  });

  return rows;
};

// -- Dead cap ---------------------------------------------------------------

export interface BuildDeadCapArgs {
  deadCapPlayers: Array<{ roster_id: number; player_id: string; salary?: number }>;
  rosters: any[];
  userMap: Record<string, any>;
  players: Record<string, any>;
}

export const buildDeadCapCsv = ({
  deadCapPlayers,
  rosters,
  userMap,
  players,
}: BuildDeadCapArgs): string[][] => {
  const rows: string[][] = [
    ['team_name', 'player_name', 'nfl_team', 'position', 'original_salary', 'dead_cap_amount'],
  ];
  deadCapPlayers.forEach((entry) => {
    const player = players[entry.player_id];
    const roster = rosters.find((r) => r.roster_id === entry.roster_id);
    const user = roster ? userMap[roster.owner_id] : null;
    rows.push([
      user ? getTeamName(user) : '',
      player ? formatPlayerName(player) : `player:${entry.player_id}`,
      String(player?.team || 'FA'),
      String(player?.position || ''),
      formatCurrencyRaw(entry.salary || 0),
      formatCurrencyRaw(Math.max(1, Math.round((entry.salary || 0) * 0.25))),
    ]);
  });
  return rows;
};

// -- Transactions -----------------------------------------------------------

export interface BuildTransactionsArgs {
  transactions: any[];
  players: Record<string, any>;
  rosterUserMap: Record<number, any>;
  salaries?: Record<string, number>;
}

export const buildTransactionsCsv = ({
  transactions,
  players,
  rosterUserMap,
  salaries = {},
}: BuildTransactionsArgs): string[][] => {
  const rows: string[][] = [
    [
      'date_iso',
      'week',
      'transaction_type',
      'fantasy_team',
      'player_name',
      'nfl_team',
      'position',
      'action',
      'faab_bid',
      'salary',
      'trade_partners',
      'draft_picks_traded',
    ],
  ];

  const sorted = [...transactions].sort((a, b) => {
    const da = a.created || a.status_updated || 0;
    const db = b.created || b.status_updated || 0;
    return db - da;
  });

  sorted.forEach((tx) => {
    const week = num(tx.leg ?? tx.week);
    const txType = transactionTypeLabel(tx.type);
    const timestamp = tx.created || tx.status_updated;
    const dateIso = formatDateISO(timestamp);

    let tradePartners = '';
    if (tx.type === 'trade' && Array.isArray(tx.roster_ids) && tx.roster_ids.length === 2) {
      const [r1, r2] = tx.roster_ids;
      tradePartners = `${getTeamName(rosterUserMap[r1])} <-> ${getTeamName(rosterUserMap[r2])}`;
    }

    let draftPicksTraded = '';
    if (Array.isArray(tx.draft_picks) && tx.draft_picks.length > 0) {
      draftPicksTraded = tx.draft_picks
        .map((p: any) => `${p.season} R${p.round}`)
        .join('; ');
    }

    if (tx.drops) {
      Object.entries(tx.drops as Record<string, number>).forEach(([playerId, rosterId]) => {
        const player = players[playerId];
        const user = rosterUserMap[rosterId];
        rows.push([
          dateIso,
          week,
          txType,
          getTeamName(user),
          player ? formatPlayerName(player) : `player:${playerId}`,
          String(player?.team || 'FA'),
          String(player?.position || ''),
          'drop',
          '',
          formatCurrencyRaw(salaries[playerId] || 0),
          tradePartners,
          draftPicksTraded,
        ]);
      });
    }

    if (tx.adds) {
      Object.entries(tx.adds as Record<string, number>).forEach(([playerId, rosterId]) => {
        const player = players[playerId];
        const user = rosterUserMap[rosterId];
        rows.push([
          dateIso,
          week,
          txType,
          getTeamName(user),
          player ? formatPlayerName(player) : `player:${playerId}`,
          String(player?.team || 'FA'),
          String(player?.position || ''),
          'add',
          formatCurrencyRaw(tx.settings?.waiver_bid),
          formatCurrencyRaw(salaries[playerId] || 0),
          tradePartners,
          draftPicksTraded,
        ]);
      });
    }

    // Pure draft-pick-only trades (no players involved)
    if (
      tx.type === 'trade' &&
      !tx.adds &&
      !tx.drops &&
      Array.isArray(tx.draft_picks) &&
      tx.draft_picks.length > 0
    ) {
      tx.draft_picks.forEach((p: any) => {
        rows.push([
          dateIso,
          week,
          'trade',
          `${getTeamName(rosterUserMap[p.previous_owner_id])} -> ${getTeamName(rosterUserMap[p.owner_id])}`,
          `${p.season} Round ${p.round} Pick`,
          '',
          'PICK',
          'trade',
          '',
          '',
          tradePartners,
          draftPicksTraded,
        ]);
      });
    }
  });

  return rows;
};

// -- Draft ------------------------------------------------------------------

export interface BuildDraftArgs {
  draftPicks: Array<{ draft?: any; picks?: any[] }>;
  league: any;
  players: Record<string, any>;
  rosterUserMap: Record<number, any>;
  salaries?: Record<string, number>;
  contracts?: Record<string, number>;
}

export const buildDraftCsv = ({
  draftPicks,
  league,
  players,
  rosterUserMap,
  salaries = {},
  contracts = {},
}: BuildDraftArgs): string[][] => {
  const rows: string[][] = [
    [
      'draft_year',
      'round',
      'pick_no',
      'team_name',
      'player_name',
      'nfl_team',
      'position',
      'is_keeper',
      'salary',
      'contract_years',
      'franchise_value',
    ],
  ];

  draftPicks.forEach(({ draft, picks }) => {
    const year = String(draft?.season ?? league?.season ?? '');
    (picks || []).forEach((pick: any) => {
      const player = players[pick.player_id];
      const user = rosterUserMap[pick.roster_id];
      rows.push([
        year,
        num(pick.round),
        num(pick.pick_no),
        getTeamName(user),
        player ? formatPlayerName(player) : 'Unknown',
        String(player?.team || 'FA'),
        String(player?.position || ''),
        formatBoolRaw(!!pick.is_keeper),
        formatCurrencyRaw(salaries[pick.player_id] || 0),
        contracts[pick.player_id] ? num(contracts[pick.player_id]) : '',
        player ? getPlayerFranchiseValueRaw(player) : '',
      ]);
    });
  });

  return rows;
};

// -- Matchups ---------------------------------------------------------------

export interface BuildMatchupsArgs {
  matchupsByWeek: Map<number, Array<{ roster_id: number; matchup_id: number; points?: number }>>;
  rosters: any[];
  userMap: Record<string, any>;
}

export const buildMatchupsCsv = ({
  matchupsByWeek,
  rosters,
  userMap,
}: BuildMatchupsArgs): string[][] => {
  const rows: string[][] = [
    ['week', 'team_1', 'score_1', 'team_2', 'score_2', 'winner', 'point_margin'],
  ];

  const rosterTeam: Record<number, string> = {};
  rosters.forEach((r) => {
    rosterTeam[r.roster_id] = getTeamName(userMap[r.owner_id]);
  });

  // Sort by week ascending — a chronological CSV is friendlier
  const weeks = Array.from(matchupsByWeek.keys()).sort((a, b) => a - b);

  weeks.forEach((week) => {
    const matchups = matchupsByWeek.get(week) || [];
    const groups: Record<number, typeof matchups> = {};
    matchups.forEach((m) => {
      groups[m.matchup_id] = groups[m.matchup_id] || [];
      groups[m.matchup_id].push(m);
    });
    Object.values(groups).forEach((pair) => {
      if (pair.length !== 2) return;
      const [a, b] = pair;
      const aName = rosterTeam[a.roster_id] || `roster:${a.roster_id}`;
      const bName = rosterTeam[b.roster_id] || `roster:${b.roster_id}`;
      const aScore = Number(a.points || 0);
      const bScore = Number(b.points || 0);
      const winner = aScore > bScore ? aName : bScore > aScore ? bName : 'tie';
      rows.push([
        String(week),
        aName,
        fixed(aScore),
        bName,
        fixed(bScore),
        winner,
        fixed(Math.abs(aScore - bScore)),
      ]);
    });
  });

  return rows;
};

// -- README manifest --------------------------------------------------------

export interface BuildReadmeArgs {
  league: any;
  files: Array<{ name: string; description: string; rowCount: number }>;
}

export const buildReadmeMarkdown = ({ league, files }: BuildReadmeArgs): string => {
  const generated = getDataTimestamp();
  const total = files.reduce((acc, f) => acc + f.rowCount, 0);
  const lines: string[] = [];
  lines.push(`# ${league?.name || 'League'} — Sleepersheets Export`);
  lines.push('');
  lines.push(`Generated: ${generated}`);
  lines.push(`League ID: ${league?.league_id ?? ''}`);
  lines.push(`Season: ${league?.season ?? ''}`);
  lines.push(`Source: https://www.sleepersheets.com (Sleeper API + your saved cap settings)`);
  lines.push('');
  lines.push('## Files');
  lines.push('');
  files.forEach((f) => {
    lines.push(`- **\`${f.name}\`** (${f.rowCount.toLocaleString()} rows) — ${f.description}`);
  });
  lines.push('');
  lines.push(`Total data rows: ${total.toLocaleString()}`);
  lines.push('');
  lines.push('## Data conventions');
  lines.push('');
  lines.push('- Currency fields are raw integers (no `$`, no commas) so spreadsheets recognise them as numbers.');
  lines.push('- Dates are ISO 8601 (`YYYY-MM-DDThh:mm:ss.sssZ`) — sortable as text, parseable everywhere.');
  lines.push('- Boolean fields use `TRUE` / `FALSE`.');
  lines.push('- Team names follow your Sleeper display preferences.');
  lines.push('- Player IDs that fail to resolve fall back to `player:<id>` so the row is still useful.');
  lines.push('');
  lines.push('## Using this export with ChatGPT');
  lines.push('');
  lines.push('Upload all CSV files at once and ask ChatGPT to build a multi-sheet Google Sheets workbook.');
  lines.push('See sleepersheets.com/export for a ready-to-use prompt.');
  lines.push('');
  return lines.join('\n');
};

export interface BuildManifestArgs {
  league: any;
  files: Array<{ name: string; description: string; rowCount: number; sheet?: string }>;
}

export const buildManifestJson = ({ league, files }: BuildManifestArgs): string => {
  const payload = {
    schema: 'sleepersheets.export/v1',
    generated_at: new Date().toISOString(),
    source: 'https://www.sleepersheets.com',
    league: {
      league_id: league?.league_id ?? null,
      name: league?.name ?? null,
      season: league?.season ?? null,
      sport: league?.sport ?? null,
      total_rosters: league?.total_rosters ?? null,
      status: league?.status ?? null,
    },
    files,
  };
  return JSON.stringify(payload, null, 2);
};
