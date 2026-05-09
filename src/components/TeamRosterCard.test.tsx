import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TeamRosterCard from "./TeamRosterCard";

// Smoke test for the React Testing Library setup. This is also the
// thinnest pure component on the team-rosters lane, so it doubles as a
// regression guard against the team-name resolution path the
// UserManagement bug exposed (PR #10).

const baseProps = {
  roster: {
    roster_id: 1,
    settings: { wins: 8, losses: 4, ties: 0, fpts: 1234.5 },
    players: ["p1", "p2", "p3"],
    taxi: [] as string[],
    reserve: [] as string[],
  },
  showSalaryFeatures: false,
  deadCapEnabled: false,
  teamSalary: 0,
  teamDeadCap: 0,
  salaryCap: 200000,
};

describe("TeamRosterCard", () => {
  it("renders the custom Sleeper team name in the heading and the owner handle as a subtitle", () => {
    render(
      <TeamRosterCard
        {...baseProps}
        user={{
          metadata: { team_name: "The Birmingham Iron" },
          display_name: "user_handle",
        }}
      />
    );
    expect(
      screen.getByRole("heading", { name: "The Birmingham Iron" })
    ).toBeInTheDocument();
    expect(screen.getByText("user_handle")).toBeInTheDocument();
  });

  it("falls back to display_name in the heading when metadata.team_name is missing", () => {
    render(
      <TeamRosterCard
        {...baseProps}
        user={{ display_name: "Just A Display Name" }}
      />
    );
    expect(
      screen.getByRole("heading", { name: "Just A Display Name" })
    ).toBeInTheDocument();
  });

  it("renders 'Unknown Team' / 'Unknown Manager' when no user is supplied", () => {
    render(<TeamRosterCard {...baseProps} user={undefined} />);
    expect(
      screen.getByRole("heading", { name: "Unknown Team" })
    ).toBeInTheDocument();
    expect(screen.getByText("Unknown Manager")).toBeInTheDocument();
  });

  it("renders the W-L-T record from roster.settings", () => {
    render(
      <TeamRosterCard
        {...baseProps}
        user={{ display_name: "Owner" }}
      />
    );
    expect(screen.getByText("8-4-0")).toBeInTheDocument();
  });

  it("shows the total player count from active + taxi + reserve", () => {
    render(
      <TeamRosterCard
        {...baseProps}
        roster={{
          ...baseProps.roster,
          players: ["1", "2", "3"],
          taxi: ["4"],
          reserve: ["5", "6"],
        }}
        user={{ display_name: "Owner" }}
      />
    );
    // Total = 6 should appear next to "Total Players"
    expect(screen.getByText("Total Players")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });
});
