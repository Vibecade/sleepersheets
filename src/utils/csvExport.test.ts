import { describe, it, expect } from "vitest";
import {
  formatPlayerName,
  getPlayerFranchiseValue,
  formatCurrency,
  sanitizeFilename,
} from "./csvExport";

describe("formatPlayerName", () => {
  it("joins first and last name with a single space", () => {
    expect(formatPlayerName({ first_name: "Travis", last_name: "Kelce" })).toBe(
      "Travis Kelce"
    );
  });

  it("trims when one name is missing", () => {
    expect(formatPlayerName({ first_name: "Cher" })).toBe("Cher");
    expect(formatPlayerName({ last_name: "Madonna" })).toBe("Madonna");
  });

  it("returns 'Unknown Player' when both names are missing", () => {
    expect(formatPlayerName({})).toBe("Unknown Player");
    expect(formatPlayerName({ first_name: "", last_name: "" })).toBe("Unknown Player");
  });
});

describe("getPlayerFranchiseValue", () => {
  it("formats fantasy_positions_value (cents) as a dollar string", () => {
    expect(
      getPlayerFranchiseValue({
        fantasy_data_nfl: { fantasy_positions_value: 12345 },
      })
    ).toBe("$123.45");
  });

  it("returns empty string when the value is missing", () => {
    expect(getPlayerFranchiseValue({})).toBe("");
    expect(getPlayerFranchiseValue(null)).toBe("");
    expect(getPlayerFranchiseValue({ fantasy_data_nfl: {} })).toBe("");
  });

  // useRosterInsights consumes this value by parsing the dollar string back
  // to a number for summing. If anyone changes the format here without
  // updating that parser, totals on the Roster Insights card silently
  // break. Pin the contract.
  it("emits a value parseable back to the original cents amount", () => {
    const formatted = getPlayerFranchiseValue({
      fantasy_data_nfl: { fantasy_positions_value: 50000 },
    });
    const parsed = parseFloat(formatted.replace(/[^0-9.-]/g, ""));
    expect(parsed).toBe(500);
  });
});

describe("formatCurrency", () => {
  it("formats integers with thousands separators", () => {
    expect(formatCurrency(1234567)).toBe("$1,234,567");
  });

  it("returns empty string for null/undefined", () => {
    expect(formatCurrency(null)).toBe("");
    expect(formatCurrency(undefined)).toBe("");
  });
});

describe("sanitizeFilename", () => {
  it("strips path-traversal characters and collapses whitespace", () => {
    expect(sanitizeFilename('my "weird" / file: name.csv')).toBe(
      "my_weird_file_name.csv"
    );
  });
});
