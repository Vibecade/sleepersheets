/**
 * Which rostered players are missing a usable salary.
 *
 * Shared by the commissioner Pricing panel (which lists them) and the
 * Pricing tab badge (which counts them) so the two can't drift apart —
 * a badge that disagrees with the list it points at is worse than no
 * badge.
 *
 * Why this matters operationally: waiver pickups are auto-priced from the
 * FAAB bid by useTransactionProcessor, but that only runs when someone
 * with `canModifyLeague` has the app open. Waivers clear Wednesday, so
 * between then and the commissioner's next visit these players carry no
 * salary and every manager's cap figure is short. Drafted and traded
 * players never auto-price at all. The count is how much of that work is
 * outstanding.
 */

/** A salary of `null` or `0` both mean "no usable cost on file". */
const hasUsableSalary = (salary: number | null | undefined): boolean =>
  salary != null && salary > 0;

/**
 * Player IDs currently on a roster (active, reserve, or taxi) with no
 * usable salary. Empty roster slots (`'0'`) and falsy IDs are ignored.
 */
export const selectUnpricedPlayerIds = (
  rosters: any[],
  salaries: Record<string, number | null>,
): Set<string> => {
  const ids = new Set<string>();

  (rosters || []).forEach((roster) => {
    const playerIds: string[] = [
      ...(roster?.players || []),
      ...(roster?.reserve || []),
      ...(roster?.taxi || []),
    ];

    playerIds.forEach((playerId) => {
      if (!playerId || playerId === '0') return;
      if (hasUsableSalary(salaries?.[playerId])) return;
      ids.add(playerId);
    });
  });

  return ids;
};
