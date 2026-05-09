import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFunStatisticsData } from "./useFunStatisticsData";

const baseUserMap = {
  u1: { user_id: "u1", display_name: "Alice", metadata: { team_name: "Alpha" } },
  u2: { user_id: "u2", display_name: "Bob" },
  u3: { user_id: "u3", display_name: "Carol" },
};

const renderData = (overrides: any = {}) =>
  renderHook(() =>
    useFunStatisticsData({
      rosters: [],
      userMap: baseUserMap,
      transactions: [],
      ...overrides,
    })
  ).result.current;

describe("useFunStatisticsData — powerRankings", () => {
  it("ranks by weighted blend of win % (0.65) and normalized points (0.35)", () => {
    const data = renderData({
      rosters: [
        { roster_id: 1, owner_id: "u1", settings: { wins: 5, losses: 5, fpts: 1500 } },
        // 5-5 same record, but more points → should rank higher
        { roster_id: 2, owner_id: "u2", settings: { wins: 5, losses: 5, fpts: 1700 } },
        { roster_id: 3, owner_id: "u3", settings: { wins: 8, losses: 2, fpts: 1400 } },
      ],
    });
    // Roster 3 has 80% win rate vs 50% — should top the list.
    expect(data.powerRankings[0].rosterId).toBe(3);
    // Between rosters 1 and 2 (same win %), roster 2 (more points) should rank higher.
    expect(data.powerRankings[1].rosterId).toBe(2);
    expect(data.powerRankings[2].rosterId).toBe(1);
  });

  it("sets trend='up' for streaks of 2+ wins", () => {
    const data = renderData({
      rosters: [
        {
          roster_id: 1,
          owner_id: "u1",
          settings: { wins: 4, losses: 1, fpts: 1000 },
          metadata: { streak: "3W" },
        },
      ],
    });
    expect(data.powerRankings[0].trend).toBe("up");
  });

  it("sets trend='down' for streaks of 2+ losses", () => {
    const data = renderData({
      rosters: [
        {
          roster_id: 1,
          owner_id: "u1",
          settings: { wins: 1, losses: 4, fpts: 800 },
          metadata: { streak: "2L" },
        },
      ],
    });
    expect(data.powerRankings[0].trend).toBe("down");
  });

  it("sets trend='neutral' for streaks of 1 (not yet a trend)", () => {
    const data = renderData({
      rosters: [
        {
          roster_id: 1,
          owner_id: "u1",
          settings: { wins: 2, losses: 2, fpts: 900 },
          metadata: { streak: "1W" },
        },
      ],
    });
    expect(data.powerRankings[0].trend).toBe("neutral");
  });

  it("computes pointsVsAvg correctly across the league", () => {
    const data = renderData({
      rosters: [
        { roster_id: 1, owner_id: "u1", settings: { wins: 0, losses: 0, fpts: 1000 } },
        { roster_id: 2, owner_id: "u2", settings: { wins: 0, losses: 0, fpts: 2000 } },
      ],
    });
    // avg = 1500. r1 is -500, r2 is +500.
    const r1 = data.powerRankings.find((r) => r.rosterId === 1);
    const r2 = data.powerRankings.find((r) => r.rosterId === 2);
    expect(r1?.pointsVsAvg).toBe(-500);
    expect(r2?.pointsVsAvg).toBe(500);
  });

  it("resolves teamName via metadata.team_name → display_name → 'Unknown Team'", () => {
    const data = renderData({
      rosters: [
        { roster_id: 1, owner_id: "u1", settings: {} }, // metadata.team_name = "Alpha"
        { roster_id: 2, owner_id: "u2", settings: {} }, // display_name = "Bob"
        { roster_id: 3, owner_id: "missing", settings: {} },
      ],
    });
    expect(data.powerRankings.find((r) => r.rosterId === 1)?.teamName).toBe("Alpha");
    expect(data.powerRankings.find((r) => r.rosterId === 2)?.teamName).toBe("Bob");
    expect(data.powerRankings.find((r) => r.rosterId === 3)?.teamName).toBe("Unknown Team");
  });
});

describe("useFunStatisticsData — streaks", () => {
  it("parses metadata.streak for streak count and type", () => {
    const data = renderData({
      rosters: [
        {
          roster_id: 1,
          owner_id: "u1",
          settings: { wins: 5, losses: 2 },
          metadata: { streak: "3W" },
        },
      ],
    });
    expect(data.streaks[0].streak).toBe(3);
    expect(data.streaks[0].streakType).toBe("win");
    expect(data.streaks[0].isHot).toBe(true);
    expect(data.streaks[0].isCold).toBe(false);
  });

  it("flags isCold for 2+ loss streaks", () => {
    const data = renderData({
      rosters: [
        {
          roster_id: 1,
          owner_id: "u1",
          settings: { wins: 1, losses: 4 },
          metadata: { streak: "4L" },
        },
      ],
    });
    expect(data.streaks[0].isCold).toBe(true);
    expect(data.streaks[0].isHot).toBe(false);
  });

  it("falls back to W vs L count when metadata.streak is absent", () => {
    const data = renderData({
      rosters: [
        {
          roster_id: 1,
          owner_id: "u1",
          settings: { wins: 5, losses: 2 },
        },
      ],
    });
    expect(data.streaks[0].streak).toBe(5);
    expect(data.streaks[0].streakType).toBe("win");
  });

  it("returns streakType='none' when there are no games and no metadata", () => {
    const data = renderData({
      rosters: [{ roster_id: 1, owner_id: "u1", settings: { wins: 0, losses: 0 } }],
    });
    expect(data.streaks[0].streakType).toBe("none");
    expect(data.streaks[0].streak).toBe(0);
  });
});

describe("useFunStatisticsData — activity", () => {
  it("counts transactions per creator and ranks by transactionCount", () => {
    const data = renderData({
      rosters: [
        { roster_id: 1, owner_id: "u1", settings: {} },
        { roster_id: 2, owner_id: "u2", settings: {} },
        { roster_id: 3, owner_id: "u3", settings: {} },
      ],
      transactions: [
        ...Array.from({ length: 12 }, () => ({ creator: "u1" })), // u1 → high (>10)
        ...Array.from({ length: 6 }, () => ({ creator: "u2" })),  // u2 → medium (>5)
        ...Array.from({ length: 2 }, () => ({ creator: "u3" })),  // u3 → low
      ],
    });
    expect(data.activity[0].user.user_id).toBe("u1");
    expect(data.activity[0].transactionCount).toBe(12);
    expect(data.activity[0].activityLevel).toBe("high");
    expect(data.activity[1].activityLevel).toBe("medium");
    expect(data.activity[2].activityLevel).toBe("low");
  });

  it("yields 0 transactionCount + 'low' for rosters whose owner has no creator entries", () => {
    const data = renderData({
      rosters: [{ roster_id: 1, owner_id: "u1", settings: {} }],
      transactions: [{ creator: "someone-else" }],
    });
    expect(data.activity[0].transactionCount).toBe(0);
    expect(data.activity[0].activityLevel).toBe("low");
  });

  it("ignores transactions with no creator field", () => {
    const data = renderData({
      rosters: [{ roster_id: 1, owner_id: "u1", settings: {} }],
      transactions: [{}, { creator: null }, { creator: "u1" }],
    });
    expect(data.activity[0].transactionCount).toBe(1);
  });
});

describe("useFunStatisticsData — isPreseason", () => {
  it("returns true when no team has played a game", () => {
    const data = renderData({
      rosters: [
        { roster_id: 1, owner_id: "u1", settings: { wins: 0, losses: 0, ties: 0 } },
        { roster_id: 2, owner_id: "u2", settings: { wins: 0, losses: 0, ties: 0 } },
      ],
    });
    expect(data.isPreseason).toBe(true);
  });

  it("returns false as soon as any team has W+L+T > 0", () => {
    const data = renderData({
      rosters: [
        { roster_id: 1, owner_id: "u1", settings: { wins: 0, losses: 0, ties: 0 } },
        { roster_id: 2, owner_id: "u2", settings: { wins: 0, losses: 0, ties: 1 } },
      ],
    });
    expect(data.isPreseason).toBe(false);
  });

  it("returns true for an empty rosters list", () => {
    const data = renderData({ rosters: [] });
    expect(data.isPreseason).toBe(true);
  });
});
