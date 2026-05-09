export interface SleeperLeagueSettings {
  week?: number;
  salary_cap?: number;
  faab_cap?: number;
  type?: string | number;
  [key: string]: unknown;
}

export interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  sport?: string;
  status?: string;
  season_type?: string;
  total_rosters?: number;
  avatar?: string;
  settings?: SleeperLeagueSettings;
  [key: string]: unknown;
}

export interface SleeperUser {
  user_id: string;
  username?: string;
  display_name?: string;
  avatar?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  league_id?: string;
  players?: string[];
  reserve?: string[];
  starters?: string[];
  taxi?: string[];
  matchup_id?: number;
  points?: number;
  settings?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SleeperDraft {
  draft_id: string;
  league_id?: string;
  type?: string;
  status?: string;
  [key: string]: unknown;
}

export interface SleeperDraftPick {
  picks?: unknown[];
  [key: string]: unknown;
}

export interface SleeperTransactionSettings {
  waiver_bid?: number;
  [key: string]: unknown;
}

export interface SleeperWaiverTransfer {
  sender?: number;
  receiver?: number;
  amount: number;
  [key: string]: unknown;
}

export interface SleeperTransaction {
  transaction_id: string;
  league_id?: string;
  type?: string;
  status?: string;
  creator?: string;
  adds?: Record<string, number | string | string[]>;
  drops?: Record<string, number | string | string[]>;
  draft_picks?: unknown[];
  roster_ids?: number[];
  waiver_budget?: SleeperWaiverTransfer[] | Record<string, number>;
  settings?: SleeperTransactionSettings;
  created?: number | string;
  created_at?: string;
  leg?: number;
  week?: number;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SleeperPlayer {
  player_id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  team?: string;
  injury_status?: string;
  [key: string]: unknown;
}

export type SleeperPlayersMap = Record<string, SleeperPlayer>;
export type SleeperUserMap = Record<string, SleeperUser>;
export type SleeperRosterUserMap = Record<number, SleeperUser | undefined>;

export interface SleeperLeagueDataStats {
  transactionCount: number;
  draftPickCount: number;
  draftCount: number;
}

export interface SleeperLeagueDataBundle {
  league: SleeperLeague;
  rosters: SleeperRoster[];
  users: SleeperUser[];
  players: SleeperPlayersMap;
  transactions?: SleeperTransaction[];
  drafts?: SleeperDraft[];
  draftPicks?: SleeperDraftPick[];
}

export interface SleeperLeagueDataContextValue extends SleeperLeagueDataBundle {
  transactions: SleeperTransaction[];
  drafts: SleeperDraft[];
  draftPicks: SleeperDraftPick[];
  userMap: SleeperUserMap;
  rosterUserMap: SleeperRosterUserMap;
  stats: SleeperLeagueDataStats;
}
