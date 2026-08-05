import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReviewQueuePanel } from './ReviewQueuePanel';
import type { ComplianceFinding } from '@/utils/compliance';

/**
 * The panel is pure presentation — all the judgement lives in
 * utils/compliance, which is tested there. These cover the states a
 * commissioner actually lands on, particularly the two that are easy to get
 * wrong: an empty queue reading as a failure, and a non-convergent replay
 * silently showing nothing with no explanation.
 */

const capFinding: ComplianceFinding = {
  id: 'cap_ceiling:t1:1',
  rule: 'cap_ceiling',
  severity: 'violation',
  rosterId: 1,
  transactionId: 't1',
  week: 5,
  summary: 'Team Reeves is $40 over the cap after this trade',
  detail: {
    salaryCap: 200,
    before: { active: 80, deadCap: 30, total: 110 },
    after: { active: 210, deadCap: 30, total: 240 },
    overBy: 40,
  },
};

const irFinding: ComplianceFinding = {
  id: 'ir_stash:2:p9',
  rule: 'ir_stash',
  severity: 'warning',
  rosterId: 2,
  summary: "Healthy Starter is on Team Vaughn's IR with no injury designation",
  detail: { shelteredSalary: 54, injuryStatus: null },
};

const defaults = { converged: true, anomalies: [] as string[], loading: false };

describe('ReviewQueuePanel', () => {
  it('reports a clean league rather than an empty void', () => {
    render(<ReviewQueuePanel findings={[]} {...defaults} />);
    expect(screen.getByText(/No rule exceptions/i)).toBeInTheDocument();
  });

  it('shows the finding and its arithmetic', () => {
    render(<ReviewQueuePanel findings={[capFinding]} {...defaults} />);

    expect(screen.getByText(/\$40 over the cap/i)).toBeInTheDocument();
    // The before/after math is what makes the claim checkable.
    expect(screen.getByText(/BEFORE/)).toBeInTheDocument();
    expect(screen.getByText(/AFTER/)).toBeInTheDocument();
  });

  it('counts only violations in the header badge', () => {
    render(<ReviewQueuePanel findings={[capFinding, irFinding]} {...defaults} />);
    expect(screen.getByText('1 VIOLATION')).toBeInTheDocument();
  });

  it('says plainly that nothing here is acted on automatically', () => {
    // Sleeper's API is read-only. A commissioner who assumes the app reversed
    // a trade would leave a real violation standing.
    render(<ReviewQueuePanel findings={[capFinding]} {...defaults} />);
    expect(screen.getByText(/read-only/i)).toBeInTheDocument();
  });

  it('explains itself when roster history could not be reconstructed', () => {
    render(
      <ReviewQueuePanel
        findings={[irFinding]}
        converged={false}
        anomalies={['t1: expected player x on roster 1 to undo an add']}
        loading={false}
      />,
    );

    expect(screen.getByText(/Roster history is incomplete/i)).toBeInTheDocument();
    // Findings that don't depend on history are still shown.
    expect(screen.getByText(/Healthy Starter/)).toBeInTheDocument();
  });

  it('renders skeletons while loading rather than a false all-clear', () => {
    const { container } = render(
      <ReviewQueuePanel findings={[]} converged anomalies={[]} loading />,
    );

    expect(screen.queryByText(/No rule exceptions/i)).not.toBeInTheDocument();
    expect(container.querySelectorAll('.h-20').length).toBeGreaterThan(0);
  });
});
