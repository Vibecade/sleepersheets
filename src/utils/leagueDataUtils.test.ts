import { describe, it, expect } from "vitest";
import {
  createUserMap,
  createRosterUserMap,
  getPlayerCount,
  getTeamName,
} from "./leagueDataUtils";

describe("getTeamName", () => {
  // This priority ordering is the root cause of the UserManagement bug
  // (commissioner panel was using `display_name || username || \`Team N\``
  // and never checking metadata.team_name, so custom Sleeper team names
  // were ignored). Pin the contract so it can't silently regress.
  it("prefers metadata.team_name over display_name", () => {
    expect(
      getTeamName({
        metadata: { team_name: "Custom Squad" },
        display_name: "Generic Display",
      })
    ).toBe("Custom Squad");
  });

  it("falls back to display_name when metadata.team_name is missing", () => {
    expect(getTeamName({ display_name: "Owner Display" })).toBe("Owner Display");
  });

  it("falls back to display_name when metadata exists but team_name is empty", () => {
    expect(
      getTeamName({ metadata: { team_name: "" }, display_name: "Owner Display" })
    ).toBe("Owner Display");
  });

  it("returns 'Unknown Team' when user is null/undefined", () => {
    expect(getTeamName(null)).toBe("Unknown Team");
    expect(getTeamName(undefined)).toBe("Unknown Team");
  });

  it("returns 'Unknown Team' when user has no usable fields", () => {
    expect(getTeamName({})).toBe("Unknown Team");
  });
});

describe("getPlayerCount", () => {
  it("sums active + taxi + reserve and returns each count", () => {
    expect(
      getPlayerCount({
        players: ["1", "2", "3"],
        taxi: ["4"],
        reserve: ["5", "6"],
      })
    ).toEqual({ active: 3, taxi: 1, reserve: 2, total: 6 });
  });

  it("treats missing arrays as zero", () => {
    expect(getPlayerCount({})).toEqual({ active: 0, taxi: 0, reserve: 0, total: 0 });
  });

  it("treats null arrays as zero (sleeper sometimes returns null for empty slots)", () => {
    expect(
      getPlayerCount({ players: null, taxi: undefined, reserve: ["x"] })
    ).toEqual({ active: 0, taxi: 0, reserve: 1, total: 1 });
  });
});

describe("createUserMap", () => {
  it("indexes users by user_id", () => {
    const users = [
      { user_id: "u1", display_name: "Alice" },
      { user_id: "u2", display_name: "Bob" },
    ];
    const map = createUserMap(users);
    expect(map["u1"].display_name).toBe("Alice");
    expect(map["u2"].display_name).toBe("Bob");
    expect(Object.keys(map)).toHaveLength(2);
  });
});

describe("createRosterUserMap", () => {
  it("maps roster_id to the owning user via owner_id", () => {
    const userMap = {
      u1: { user_id: "u1", display_name: "Alice" },
      u2: { user_id: "u2", display_name: "Bob" },
    };
    const rosters = [
      { roster_id: 1, owner_id: "u1" },
      { roster_id: 2, owner_id: "u2" },
    ];
    const result = createRosterUserMap(rosters, userMap);
    expect(result[1].display_name).toBe("Alice");
    expect(result[2].display_name).toBe("Bob");
  });

  it("yields undefined for rosters whose owner is missing from userMap", () => {
    const result = createRosterUserMap(
      [{ roster_id: 1, owner_id: "missing" }],
      {}
    );
    expect(result[1]).toBeUndefined();
  });
});
