import { describe, it, expect } from "vitest";
import { buildActivityRows } from "./activity";

const build = (
  waiverWrites: Array<{ playerId: string; salary: number }> = [],
  deadCapWrites: Array<{ playerId: string; salary: number }> = [],
) => buildActivityRows({ leagueId: "L1", waiverWrites, deadCapWrites });

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

  it("counts rather than naming, and carries ids for the reader to resolve", () => {
    // An earlier version tried to name the player in the title. It could
    // never work: naming here would mean this job downloading Sleeper's ~5MB
    // player file on every run that writes, and a baked-in name freezes while
    // the rest of the app moves on. The dashboard already holds the player
    // map, so the ids travel and it resolves them at render time.
    const [row] = build([{ playerId: "p1", salary: 20 }]);
    expect(row.title).toBe("Priced 1 waiver claim");
    expect(row.metadata.players).toEqual([{ playerId: "p1", salary: 20 }]);
  });

  it("carries an id and salary for every affected player", () => {
    // The feed lists them individually, so an entry missing a player is a
    // player whose change nobody can see.
    const [row] = build([], [
      { playerId: "p1", salary: 30 },
      { playerId: "p2", salary: 50 },
    ]);
    expect(row.metadata.players).toEqual([
      { playerId: "p1", salary: 30 },
      { playerId: "p2", salary: 50 },
    ]);
  });

  it("records dead cap against the salary charged, not the penalty", () => {
    // The cap engine applies max(1, round(salary * 0.25)) at read time.
    // Reporting the discounted figure here would imply it had been applied
    // twice.
    const [row] = build([], [{ playerId: "p9", salary: 80 }]);

    expect(row.activity_type).toBe("automation_dead_cap");
    expect(row.title).toBe("Dead cap — 1 player released");
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

  it("keeps every player in metadata when the title summarises", () => {
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
