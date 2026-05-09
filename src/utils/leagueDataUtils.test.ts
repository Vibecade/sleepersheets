import { describe, it, expect } from "vitest";
import {
  createUserMap,
  createRosterUserMap,
  getPlayerCount,
  getTeamName,
  normalizeUsersToMap,
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

describe("normalizeUsersToMap", () => {
  // This helper exists because LeagueData.tsx ships `leagueDataForExport`
  // with `users: Object.values(userMap)` (an array), but downstream panels
  // historically indexed it as a map (`users[ownerId]`) and got `undefined`
  // every time. PR #10 caught it in UserManagement; the same pattern was
  // also present in TransactionManagement.
  it("converts an array keyed by user_id into a map", () => {
    const result = normalizeUsersToMap([
      { user_id: "u1", display_name: "Alice" } as any,
      { user_id: "u2", display_name: "Bob" } as any,
    ]);
    expect(result["u1"].display_name).toBe("Alice");
    expect(result["u2"].display_name).toBe("Bob");
    expect(Object.keys(result)).toHaveLength(2);
  });

  it("passes a map through unchanged (returns the same shape)", () => {
    const input = {
      u1: { user_id: "u1", display_name: "Alice" } as any,
      u2: { user_id: "u2", display_name: "Bob" } as any,
    };
    const result = normalizeUsersToMap(input);
    expect(result).toBe(input);
  });

  it("returns an empty map for null / undefined", () => {
    expect(normalizeUsersToMap(null)).toEqual({});
    expect(normalizeUsersToMap(undefined)).toEqual({});
  });

  it("skips array entries without a user_id rather than throwing", () => {
    const result = normalizeUsersToMap([
      { user_id: "u1", display_name: "Alice" } as any,
      { display_name: "No ID" } as any,
      null as any,
    ]);
    expect(Object.keys(result)).toEqual(["u1"]);
  });
});
