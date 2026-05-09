import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDataDashboardTables } from "./useDataDashboardTables";

const baseUserMap = {
  u1: { user_id: "u1", display_name: "Alice", metadata: { team_name: "Alpha" } },
  u2: { user_id: "u2", display_name: "Bob" },
};
const baseRosterUserMap = { 1: baseUserMap.u1, 2: baseUserMap.u2 };
const basePlayers = {
  p1: { player_id: "p1", first_name: "Player", last_name: "One", team: "KC", position: "QB" },
  p2: { player_id: "p2", first_name: "Player", last_name: "Two", team: "BUF", position: "RB" },
  p3: { player_id: "p3", first_name: "Player", last_name: "Three", team: "DAL", position: "WR" },
};

const renderTables = (overrides: any = {}) =>
  renderHook(() =>
    useDataDashboardTables({
      rosters: [],
      userMap: baseUserMap,
      rosterUserMap: baseRosterUserMap,
      players: basePlayers,
      transactions: [],
      draftPicks: [],
      rosterFilter: "",
      transactionFilter: "",
      draftFilter: "",
      ...overrides,
    })
  ).result.current;

describe("useDataDashboardTables — rosterData", () => {
  it("flattens roster.players into rows with the resolved team name", () => {
    const tables = renderTables({
      rosters: [
        {
          roster_id: 1,
          owner_id: "u1",
          players: ["p1", "p2"],
          reserve: [],
          taxi: [],
        },
      ],
    });
    expect(tables.rosterData).toHaveLength(2);
    expect(tables.rosterData[0]).toMatchObject({
      playerId: "p1",
      playerName: "Player One",
      nflTeam: "KC",
      position: "QB",
      fantasyTeam: "Alpha",
      rosterStatus: "Active",
    });
  });

  it("dedups players using priority order Active > Reserve > Taxi", () => {
    const tables = renderTables({
      rosters: [
        {
          roster_id: 1,
          owner_id: "u1",
          players: ["p1"],       // p1 active
          reserve: ["p1", "p2"], // p1 also listed as reserve (should be ignored)
          taxi: ["p1", "p3"],    // p1 also taxi (ignored), p3 taxi
        },
      ],
    });
    // p1 keeps Active status, not Reserve or Taxi.
    const p1Row = tables.rosterData.find((r) => r.playerId === "p1");
    expect(p1Row?.rosterStatus).toBe("Active");
    // p2 wasn't in players[], so it carries Reserve.
    const p2Row = tables.rosterData.find((r) => r.playerId === "p2");
    expect(p2Row?.rosterStatus).toBe("Reserve");
    // p3 only on taxi.
    const p3Row = tables.rosterData.find((r) => r.playerId === "p3");
    expect(p3Row?.rosterStatus).toBe("Taxi Squad");
    // No duplicate rows.
    expect(tables.rosterData).toHaveLength(3);
  });

  it("skips player IDs that aren't in the players map", () => {
    const tables = renderTables({
      rosters: [
        {
          roster_id: 1,
          owner_id: "u1",
          players: ["p1", "missing-id"],
          reserve: [],
          taxi: [],
        },
      ],
    });
    expect(tables.rosterData).toHaveLength(1);
    expect(tables.rosterData[0].playerId).toBe("p1");
  });
});

describe("useDataDashboardTables — transactionData", () => {
  it("emits one row per add and per drop", () => {
    const tables = renderTables({
      transactions: [
        {
          leg: 5,
          adds: { p1: 1 },
          drops: { p2: 1 },
        },
      ],
    });
    expect(tables.transactionData).toHaveLength(2);
    expect(tables.transactionData.find((r) => r.action === "Add")).toMatchObject({
      playerId: "p1",
      week: 5,
      fantasyTeam: "Alpha",
    });
    expect(tables.transactionData.find((r) => r.action === "Drop")).toMatchObject({
      playerId: "p2",
      week: 5,
    });
  });

  it("uses 'N/A' when neither leg nor week is set", () => {
    const tables = renderTables({
      transactions: [{ adds: { p1: 1 } }],
    });
    expect(tables.transactionData[0].week).toBe("N/A");
  });

  it("skips transactions whose player is not in the players map", () => {
    const tables = renderTables({
      transactions: [
        { leg: 1, adds: { "missing-id": 1 } },
        { leg: 1, adds: { p1: 1 } },
      ],
    });
    expect(tables.transactionData).toHaveLength(1);
    expect(tables.transactionData[0].playerId).toBe("p1");
  });
});

describe("useDataDashboardTables — draftData", () => {
  it("emits one row per pick across all drafts", () => {
    const tables = renderTables({
      draftPicks: [
        {
          picks: [
            { player_id: "p1", round: 1, pick_no: 5, roster_id: 1, is_keeper: false },
            { player_id: "p2", round: 1, pick_no: 6, roster_id: 2, is_keeper: true },
          ],
        },
      ],
    });
    expect(tables.draftData).toHaveLength(2);
    expect(tables.draftData[0]).toMatchObject({
      playerId: "p1",
      round: 1,
      pick: 5,
      fantasyTeam: "Alpha",
      isKeeper: "No",
    });
    expect(tables.draftData[1].isKeeper).toBe("Yes");
  });

  it("renders 'Unknown Player' when the picked player isn't in the players map", () => {
    const tables = renderTables({
      draftPicks: [
        { picks: [{ player_id: "missing", round: 2, pick_no: 1, roster_id: 1 }] },
      ],
    });
    expect(tables.draftData[0].playerName).toBe("Unknown Player");
  });
});

describe("useDataDashboardTables — filtering", () => {
  const filterRosters = [
    {
      roster_id: 1,
      owner_id: "u1",
      players: ["p1", "p2"],
      reserve: [],
      taxi: [],
    },
  ];

  it("matches roster rows against playerName / position / nflTeam / fantasyTeam", () => {
    const tables = renderTables({
      rosters: filterRosters,
      rosterFilter: "kc", // matches p1's team
    });
    expect(tables.filteredRosterData.map((r) => r.playerId)).toEqual(["p1"]);
  });

  it("filter is case-insensitive", () => {
    const tables = renderTables({
      rosters: filterRosters,
      rosterFilter: "ALPHA",
    });
    expect(tables.filteredRosterData).toHaveLength(2);
  });

  it("returns the unfiltered table when filter is empty", () => {
    const tables = renderTables({
      rosters: filterRosters,
      rosterFilter: "",
    });
    expect(tables.filteredRosterData).toEqual(tables.rosterData);
  });

  it("draftFilter matches by round/pick number too", () => {
    const tables = renderTables({
      draftPicks: [
        {
          picks: [
            { player_id: "p1", round: 3, pick_no: 12, roster_id: 1 },
            { player_id: "p2", round: 5, pick_no: 30, roster_id: 1 },
          ],
        },
      ],
      draftFilter: "30",
    });
    expect(tables.filteredDraftData).toHaveLength(1);
    expect(tables.filteredDraftData[0].pick).toBe(30);
  });
});
