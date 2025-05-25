
export interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  settings?: {
    week?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
  [key: string]: any;
}

export interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  league_id: string;
  [key: string]: any;
}

export interface SleeperDraft {
  draft_id: string;
  league_id: string;
  [key: string]: any;
}

export interface SleeperTransaction {
  transaction_id: string;
  league_id: string;
  [key: string]: any;
}

export interface SleeperPlayer {
  player_id: string;
  full_name: string;
  position: string;
  team: string;
  [key: string]: any;
}
