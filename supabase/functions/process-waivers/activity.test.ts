import { describe, it, expect } from "vitest";
import { buildActivityRows } from "./activity";

const build = (
  waiverWrites: Array<{ playerId: string; salary: number }> = [],
  deadCapWrites: Array<{ playerId: string; salary: number }> = [],
  names?: Record<string, string>,
) =>
  buildActivityRows({
    leagueId: "L1",
    waiverWrites,
    deadCapWrites,
    playerNames: names ? new Map(Object.entries(names)) : undefined,
  });

describe("buildActivityRows", () => {
  it("records nothing when a run wrote nothing", () => {
    // The job sweeps every enabled league every six hours. Recording
    // "nothing to do" would bury the entries that matter under thousands
    // that don't.
    expect(build()).toEqual([]);
  });

  it("records priced waiver claims with the total", () => {
    const [row] = build([
      { playerId: "p1", salary: 20 },
      { playerId: "p2", salary: 27 },
    ]);

    expect(row.activity_type).toBe("automation_waiver_pricing");
    expect(row.title).toBe("Priced 2 waiver claims");
    expect(row.description).toContain("$47");
    expect(row.metadata.totalSalary).toBe(47);
  });

  it("names the player when a run touched exactly one", () => {
    // "Priced 1 waiver claim" makes you open the metadata to learn something
    // the title had room for.
    const [row] = build([{ playerId: "p1", salary: 20 }], [], { p1: "Jaylen Waddle" });
    expect(row.title).toBe("Priced Jaylen Waddle");
  });

  it("falls back to a count when the single player's name is unknown", () => {
    const [row] = build([{ playerId: "p1", salary: 20 }]);
    expect(row.title).toBe("Priced 1 waiver claim");
  });

  it("records dead cap against the salary charged, not the penalty", () => {
    // The cap engine applies max(1, round(salary * 0.25)) at read time.
    // Reporting the discounted figure here would imply it had been applied
    // twice.
    const [row] = build([], [{ playerId: "p9", salary: 80 }], { p9: "D. Swift" });

    expect(row.activity_type).toBe("automation_dead_cap");
    expect(row.title).toBe("Dead cap — D. Swift");
    expect(row.metadata.totalSalaryCharged).toBe(80);
    expect(row.description).toContain("$80");
  });

  it("records both capabilities separately in one run", () => {
    const rows = build([{ playerId: "p1", salary: 20 }], [{ playerId: "p9", salary: 80 }]);
    expect(rows.map((r) => r.activity_type)).toEqual([
      "automation_waiver_pricing",
      "automation_dead_cap",
    ]);
  });

  it("attributes to nobody, because nobody did it", () => {
    const rows = build([{ playerId: "p1", salary: 20 }], [{ playerId: "p9", salary: 80 }]);
    expect(rows.every((r) => r.user_id === null)).toBe(true);
  });

  it("keeps every player in metadata even when the title summarises", () => {
    const [row] = build([
      { playerId: "p1", salary: 10 },
      { playerId: "p2", salary: 20 },
      { playerId: "p3", salary: 30 },
    ]);
    expect(row.metadata.players).toHaveLength(3);
    expect(row.title).toBe("Priced 3 waiver claims");
  });

  it("survives missing salaries without producing NaN", () => {
    const [row] = build([
      { playerId: "p1", salary: Number.NaN },
      { playerId: "p2", salary: 20 },
    ]);
    expect(row.metadata.totalSalary).toBe(20);
    expect(row.description).not.toContain("NaN");
  });

  it("uses activity_type values the table's CHECK constraint allows", () => {
    // The constraint was extended for exactly these two; a typo here would
    // fail at insert time in production rather than in this suite.
    const rows = build([{ playerId: "p1", salary: 1 }], [{ playerId: "p2", salary: 1 }]);
    const allowed = ["automation_waiver_pricing", "automation_dead_cap"];
    expect(rows.every((r) => allowed.includes(r.activity_type))).toBe(true);
  });
});
