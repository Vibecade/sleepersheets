import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useGamificationDerivedData,
  formatRecord,
  formatPlayerName,
} from "./useGamificationDerivedData";
import type { SleeperPlayer, SleeperRoster } from "@/types/sleeper";

// Test fixtures use partial shapes for brevity; cast to satisfy the
// stricter Sleeper types since these tests don't exercise the omitted
// fields.
const asRoster = (partial: Partial<SleeperRoster>) => partial as SleeperRoster;
const asPlayer = (partial: Partial<SleeperPlayer>) => partial as SleeperPlayer;

const emptyInsights = {
  week: 7,
  matchups: [],
  winnersBracket: [],
  losersBracket: [],
  tradedPicks: [],
  trendingAdds: [],
  trendingDrops: [],
  unavailableSources: [],
};

describe("formatRecord", () => {
  it("renders W-L when ties are 0", () => {
    expect(formatRecord(asRoster({ settings: { wins: 8, losses: 4, ties: 0 } }))).toBe("8-4");
  });

  it("includes ties when present", () => {
    expect(formatRecord(asRoster({ settings: { wins: 7, losses: 4, ties: 1 } }))).toBe("7-4-1");
  });

  it("treats missing settings as 0-0", () => {
    expect(formatRecord(asRoster({}))).toBe("0-0");
    expect(formatRecord(undefined)).toBe("0-0");
  });
});

describe("formatPlayerName", () => {
  it("prefers full_name when present", () => {
    expect(formatPlayerName(asPlayer({ full_name: "Travis Kelce" }), "fallback")).toBe(
      "Travis Kelce"
    );
  });

  it("joins first + last when full_name is missing", () => {
    expect(
      formatPlayerName(asPlayer({ first_name: "Patrick", last_name: "Mahomes" }), "fb")
    ).toBe("Patrick Mahomes");
  });

  it("returns fallback for null/empty player", () => {
    expect(formatPlayerName(undefined, "PLAYER_42")).toBe("PLAYER_42");
    expect(formatPlayerName(asPlayer({ first_name: "", last_name: "" }), "PLAYER_42")).toBe(
      "PLAYER_42"
    );
  });
});

describe("useGamificationDerivedData", () => {
  const baseUserMap = {
    u1: { user_id: "u1", display_name: "Alice", metadata: { team_name: "Alpha" } },
    u2: { user_id: "u2", display_name: "Bob" },
  };
  const baseRosters = [
    {
      roster_id: 1,
      owner_id: "u1",
      starters: ["p1", "p2"],
      settings: { wins: 5, losses: 2, fpts: 1100 },
    },
    {
      roster_id: 2,
      owner_id: "u2",
      starters: ["p3", "p4"],
      settings: { wins: 5, losses: 2, fpts: 950 },
    },
    {
      roster_id: 3,
      owner_id: "u3",
      starters: ["p5"],
      settings: { wins: 1, losses: 6, fpts: 800 },
    },
  ];

  const renderDerived = (overrides: any = {}) =>
    renderHook(() =>
      useGamificationDerivedData({
        league: { settings: { playoff_teams: 2 } },
        rosters: baseRosters,
        players: {},
        userMap: baseUserMap,
        transactions: [],
        insights: emptyInsights,
        ...overrides,
      })
    ).result.current;

  describe("getTeamLabel", () => {
    it("returns the resolved team name (custom team name when present)", () => {
      const derived = renderDerived();
      expect(derived.getTeamLabel(1)).toBe("Alpha");
      expect(derived.getTeamLabel(2)).toBe("Bob");
    });

    it("falls back to 'Team N' for unknown roster ids", () => {
      const derived = renderDerived();
      expect(derived.getTeamLabel(99)).toBe("Team 99");
    });
  });

  describe("standings", () => {
    it("sorts by wins desc, then fpts desc as tiebreaker", () => {
      const derived = renderDerived();
      // Roster 1 and 2 both have 5 wins; 1 has more fpts so it ranks first.
      expect(derived.standings.map((r: any) => r.roster_id)).toEqual([1, 2, 3]);
    });
  });

  describe("rivalryGame", () => {
    it("picks the closest matchup (smallest point gap wins)", () => {
      const derived = renderDerived({
        insights: {
          ...emptyInsights,
          matchups: [
            // Matchup 1: gap = 30
            { matchup_id: 1, roster_id: 1, points: 100, starters: [], players: [], custom_points: null },
            { matchup_id: 1, roster_id: 2, points: 70, starters: [], players: [], custom_points: null },
            // Matchup 2: gap = 5  ← closest, should win
            { matchup_id: 2, roster_id: 3, points: 95, starters: [], players: [], custom_points: null },
            { matchup_id: 2, roster_id: 4, points: 100, starters: [], players: [], custom_points: null },
          ],
        },
      });
      expect(derived.rivalryGame).not.toBeNull();
      expect(derived.rivalryGame.diff).toBe(5);
      expect(derived.rivalryGame.combinedPoints).toBe(195);
    });

    it("breaks ties on combinedPoints (favors high-scoring shootouts)", () => {
      const derived = renderDerived({
        insights: {
          ...emptyInsights,
          matchups: [
            // Both matchups have gap=5, but matchup 2 has higher combined points.
            { matchup_id: 1, roster_id: 1, points: 50, starters: [], players: [], custom_points: null },
            { matchup_id: 1, roster_id: 2, points: 55, starters: [], players: [], custom_points: null },
            { matchup_id: 2, roster_id: 3, points: 130, starters: [], players: [], custom_points: null },
            { matchup_id: 2, roster_id: 4, points: 135, starters: [], players: [], custom_points: null },
          ],
        },
      });
      expect(derived.rivalryGame.combinedPoints).toBe(265);
    });

    it("returns null when no full matchup pair is available", () => {
      const derived = renderDerived({
        insights: {
          ...emptyInsights,
          matchups: [
            { matchup_id: 1, roster_id: 1, points: 100, starters: [], players: [], custom_points: null },
            // Lonely matchup — no opponent, can't form a pair.
          ],
        },
      });
      expect(derived.rivalryGame).toBeNull();
    });
  });

  describe("contestedAdds", () => {
    it("returns top 3 most-claimed players from completed transactions", () => {
      const derived = renderDerived({
        players: {
          p1: { full_name: "Player One" },
          p2: { full_name: "Player Two" },
          p3: { full_name: "Player Three" },
          p4: { full_name: "Player Four" },
        },
        transactions: [
          { status: "complete", adds: { p1: 1 } },
          { status: "complete", adds: { p1: 2 } },
          { status: "complete", adds: { p1: 3 } }, // p1: 3
          { status: "complete", adds: { p2: 1 } },
          { status: "complete", adds: { p2: 2 } }, // p2: 2
          { status: "complete", adds: { p3: 1 } }, // p3: 1
          { status: "complete", adds: { p4: 1 } }, // p4: 1, but only top-3 returned
          { status: "failed", adds: { p1: 1 } }, // ignored
        ],
      });
      expect(derived.contestedAdds).toHaveLength(3);
      expect(derived.contestedAdds[0]).toMatchObject({
        playerId: "p1",
        count: 3,
        playerName: "Player One",
      });
      expect(derived.contestedAdds[1].playerId).toBe("p2");
    });

    it("ignores transactions whose status is not 'complete'", () => {
      const derived = renderDerived({
        transactions: [
          { status: "pending", adds: { p1: 1 } },
          { status: "failed", adds: { p1: 1 } },
        ],
      });
      expect(derived.contestedAdds).toHaveLength(0);
    });
  });

  describe("weeklyQuests", () => {
    it("computes lineups quest from rosters with non-empty starters", () => {
      const derived = renderDerived();
      const lineupsQuest = derived.weeklyQuests.find((q: any) => q.id === "lineups");
      // All 3 sample rosters have non-zero starters
      expect(lineupsQuest?.current).toBe(3);
      expect(lineupsQuest?.target).toBe(3);
    });

    it("counts a roster with all-zero starter slots as not-set", () => {
      const derived = renderDerived({
        rosters: [
          {
            roster_id: 1,
            owner_id: "u1",
            starters: ["0", "0", "0"], // empty slots
            settings: { wins: 0, losses: 0, fpts: 0 },
          },
        ],
      });
      const lineupsQuest = derived.weeklyQuests.find((q: any) => q.id === "lineups");
      expect(lineupsQuest?.current).toBe(0);
    });
  });
});
