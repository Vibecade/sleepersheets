import { describe, it, expect } from 'vitest';
import { isMissingTableError } from './supabaseErrors';

describe('isMissingTableError', () => {
  it('matches the PostgREST code for a table missing from the schema cache', () => {
    // The exact shape production returns for gamification_quest_snapshots.
    expect(
      isMissingTableError({
        code: 'PGRST205',
        message: "Could not find the table 'public.gamification_quest_snapshots' in the schema cache",
      })
    ).toBe(true);
  });

  it('matches the older PGRST202 spelling', () => {
    expect(isMissingTableError({ code: 'PGRST202', message: 'not found' })).toBe(true);
  });

  it("matches Postgres' own undefined_table SQLSTATE", () => {
    expect(isMissingTableError({ code: '42P01', message: 'relation "foo" does not exist' })).toBe(true);
  });

  it('falls back to the message when the client drops the code', () => {
    expect(
      isMissingTableError({ message: "Could not find the table 'public.whatever' in the schema cache" })
    ).toBe(true);
  });

  // The important half: real failures have to stay loud, or this helper
  // turns into a way to silently swallow bugs.
  it('does not match a permission failure', () => {
    expect(
      isMissingTableError({ code: '42501', message: 'permission denied for table quest_snapshots' })
    ).toBe(false);
  });

  it('does not match a constraint violation', () => {
    expect(
      isMissingTableError({ code: '23505', message: 'duplicate key value violates unique constraint' })
    ).toBe(false);
  });

  it('does not match an RLS rejection that mentions a table', () => {
    expect(
      isMissingTableError({
        code: '42501',
        message: 'new row violates row-level security policy for table "gamification_quest_snapshots"',
      })
    ).toBe(false);
  });

  it('does not match a network error', () => {
    expect(isMissingTableError(new TypeError('Failed to fetch'))).toBe(false);
  });

  it('requires both a missing-phrase and the word table', () => {
    // A column error says "does not exist" but is a genuine bug to surface.
    expect(isMissingTableError({ message: 'column "quest_points" does not exist' })).toBe(false);
  });

  it('handles null, undefined and primitives without throwing', () => {
    expect(isMissingTableError(null)).toBe(false);
    expect(isMissingTableError(undefined)).toBe(false);
    expect(isMissingTableError('PGRST205')).toBe(false);
    expect(isMissingTableError(404)).toBe(false);
  });
});
