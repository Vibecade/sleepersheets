import type { CombinedLeagueData } from '@/utils/leagueApi';

export const DEMO_LEAGUE_ID = 'DEMO_LEAGUE';

export const createDemoLeagueData = (): CombinedLeagueData => {
  return {
    league: {
      league_id: DEMO_LEAGUE_ID,
      name: "Dynasty Demo League",
      season: "2024",
      settings: {
        week: 15,
        playoff_week_start: 15,
        num_teams: 12,
        roster_positions: ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'FLEX', 'SUPER_FLEX', 'BN', 'BN', 'BN', 'BN', 'BN', 'BN', 'BN', 'BN', 'BN', 'BN', 'BN', 'BN', 'BN', 'BN', 'BN', 'BN', 'TAXI', 'TAXI', 'TAXI', 'TAXI', 'TAXI']
      },
      scoring_settings: {
        pass_yd: 0.04,
        pass_td: 4,
        rush_yd: 0.1,
        rush_td: 6,
        rec: 0.5,
        rec_yd: 0.1,
        rec_td: 6
      },
      season_type: 'regular',
      sport: 'nfl'
    },
    rosters: [
      {
        roster_id: 1,
        owner_id: 'demo_user_1',
        league_id: DEMO_LEAGUE_ID,
        players: ['4046', '4663', '5849', '6797', '7528', '8146', '8547', '9226', '9488', '9509', '10859', '11675', '11687', '11703'],
        starters: ['4046', '4663', '5849', '6797', '7528', '8146', '8547', '9226', '9488'],
        taxi: ['11675', '11687', '11703'],
        reserve: [],
        settings: {
          wins: 9,
          losses: 5,
          ties: 0,
          fpts: 1845.5,
          fpts_against: 1623.2
        }
      },
      {
        roster_id: 2,
        owner_id: 'demo_user_2',
        league_id: DEMO_LEAGUE_ID,
        players: ['2133', '4040', '4881', '5870', '6955', '7564', '8101', '9317', '9488', '10224', '11644', '11692', '11698'],
        starters: ['2133', '4040', '4881', '5870', '6955', '7564', '8101', '9317', '9488'],
        taxi: ['11644', '11692', '11698'],
        reserve: [],
        settings: {
          wins: 11,
          losses: 3,
          ties: 0,
          fpts: 1923.8,
          fpts_against: 1512.4
        }
      },
      {
        roster_id: 3,
        owner_id: 'demo_user_3',
        league_id: DEMO_LEAGUE_ID,
        players: ['4984', '5045', '5849', '6806', '7571', '8114', '8780', '9226', '9509', '10859', '11644', '11687', '11703'],
        starters: ['4984', '5045', '5849', '6806', '7571', '8114', '8780', '9226', '9509'],
        taxi: ['11644', '11687', '11703'],
        reserve: [],
        settings: {
          wins: 7,
          losses: 7,
          ties: 0,
          fpts: 1756.3,
          fpts_against: 1734.8
        }
      }
    ],
    users: [
      {
        user_id: 'demo_user_1',
        username: 'ChampionManager',
        display_name: 'The Dynasty King',
        metadata: {
          team_name: 'Gridiron Giants'
        }
      },
      {
        user_id: 'demo_user_2',
        username: 'FantasyGuru',
        display_name: 'Fantasy Guru',
        metadata: {
          team_name: 'Championship Chase'
        }
      },
      {
        user_id: 'demo_user_3',
        username: 'DynastyBuilder',
        display_name: 'Dynasty Builder',
        metadata: {
          team_name: 'Future Champions'
        }
      }
    ],
    players: {
      '4046': {
        player_id: '4046',
        full_name: 'Josh Allen',
        first_name: 'Josh',
        last_name: 'Allen',
        position: 'QB',
        team: 'BUF',
        years_exp: 6,
        status: 'Active'
      },
      '4663': {
        player_id: '4663',
        full_name: 'Christian McCaffrey',
        first_name: 'Christian',
        last_name: 'McCaffrey',
        position: 'RB',
        team: 'SF',
        years_exp: 7,
        status: 'Active'
      },
      '5849': {
        player_id: '5849',
        full_name: 'Cooper Kupp',
        first_name: 'Cooper',
        last_name: 'Kupp',
        position: 'WR',
        team: 'LAR',
        years_exp: 7,
        status: 'Active'
      },
      '6797': {
        player_id: '6797',
        full_name: 'Travis Kelce',
        first_name: 'Travis',
        last_name: 'Kelce',
        position: 'TE',
        team: 'KC',
        years_exp: 11,
        status: 'Active'
      },
      '7528': {
        player_id: '7528',
        full_name: 'Justin Jefferson',
        first_name: 'Justin',
        last_name: 'Jefferson',
        position: 'WR',
        team: 'MIN',
        years_exp: 4,
        status: 'Active'
      },
      '8146': {
        player_id: '8146',
        full_name: 'Jonathan Taylor',
        first_name: 'Jonathan',
        last_name: 'Taylor',
        position: 'RB',
        team: 'IND',
        years_exp: 4,
        status: 'Active'
      },
      '8547': {
        player_id: '8547',
        full_name: 'CeeDee Lamb',
        first_name: 'CeeDee',
        last_name: 'Lamb',
        position: 'WR',
        team: 'DAL',
        years_exp: 4,
        status: 'Active'
      },
      '9226': {
        player_id: '9226',
        full_name: 'Ja\'Marr Chase',
        first_name: 'Ja\'Marr',
        last_name: 'Chase',
        position: 'WR',
        team: 'CIN',
        years_exp: 3,
        status: 'Active'
      },
      '9488': {
        player_id: '9488',
        full_name: 'Kyle Pitts',
        first_name: 'Kyle',
        last_name: 'Pitts',
        position: 'TE',
        team: 'ATL',
        years_exp: 3,
        status: 'Active'
      },
      '9509': {
        player_id: '9509',
        full_name: 'Najee Harris',
        first_name: 'Najee',
        last_name: 'Harris',
        position: 'RB',
        team: 'PIT',
        years_exp: 3,
        status: 'Active'
      },
      '2133': {
        player_id: '2133',
        full_name: 'Patrick Mahomes',
        first_name: 'Patrick',
        last_name: 'Mahomes',
        position: 'QB',
        team: 'KC',
        years_exp: 7,
        status: 'Active'
      },
      '4040': {
        player_id: '4040',
        full_name: 'Lamar Jackson',
        first_name: 'Lamar',
        last_name: 'Jackson',
        position: 'QB',
        team: 'BAL',
        years_exp: 6,
        status: 'Active'
      },
      '4881': {
        player_id: '4881',
        full_name: 'Tyreek Hill',
        first_name: 'Tyreek',
        last_name: 'Hill',
        position: 'WR',
        team: 'MIA',
        years_exp: 8,
        status: 'Active'
      },
      '11675': {
        player_id: '11675',
        full_name: 'Rome Odunze',
        first_name: 'Rome',
        last_name: 'Odunze',
        position: 'WR',
        team: 'CHI',
        years_exp: 0,
        status: 'Active'
      },
      '11687': {
        player_id: '11687',
        full_name: 'Jayden Daniels',
        first_name: 'Jayden',
        last_name: 'Daniels',
        position: 'QB',
        team: 'WAS',
        years_exp: 0,
        status: 'Active'
      },
      '11703': {
        player_id: '11703',
        full_name: 'Caleb Williams',
        first_name: 'Caleb',
        last_name: 'Williams',
        position: 'QB',
        team: 'CHI',
        years_exp: 0,
        status: 'Active'
      }
    },
    transactions: [
      {
        transaction_id: 'demo_txn_1',
        league_id: DEMO_LEAGUE_ID,
        type: 'trade',
        status: 'complete',
        creator: 'demo_user_1',
        adds: {
          'demo_user_1': ['8547'],
          'demo_user_2': ['5849']
        },
        drops: {
          'demo_user_1': ['5849'],
          'demo_user_2': ['8547']
        },
        week: 8,
        status_updated: 1699123200,
        created: 1699036800
      },
      {
        transaction_id: 'demo_txn_2',
        league_id: DEMO_LEAGUE_ID,
        type: 'waiver',
        status: 'complete',
        creator: 'demo_user_3',
        adds: {
          'demo_user_3': ['11644']
        },
        drops: {},
        waiver_budget: [
          {
            sender: 3,
            receiver: 0,
            amount: 25
          }
        ],
        week: 12,
        status_updated: 1700764800,
        created: 1700678400
      }
    ],
    drafts: [
      {
        draft_id: 'demo_draft_1',
        league_id: DEMO_LEAGUE_ID,
        type: 'snake',
        status: 'complete',
        start_time: 1693526400,
        sport: 'nfl',
        season: '2024'
      }
    ],
    draftPicks: [
      {
        draft: {
          draft_id: 'demo_draft_1',
          league_id: DEMO_LEAGUE_ID,
          type: 'snake',
          status: 'complete',
          start_time: 1693526400,
          sport: 'nfl',
          season: '2024'
        },
        picks: [
          {
            pick_no: 1,
            round: 1,
            roster_id: 2,
            player_id: '2133',
            picked_by: 'demo_user_2',
            metadata: {
              years_exp: 7,
              rookie_year: 2017
            }
          },
          {
            pick_no: 2,
            round: 1,
            roster_id: 1,
            player_id: '4046',
            picked_by: 'demo_user_1',
            metadata: {
              years_exp: 6,
              rookie_year: 2018
            }
          },
          {
            pick_no: 3,
            round: 1,
            roster_id: 3,
            player_id: '4040',
            picked_by: 'demo_user_3',
            metadata: {
              years_exp: 6,
              rookie_year: 2018
            }
          }
        ]
      }
    ]
  };
};