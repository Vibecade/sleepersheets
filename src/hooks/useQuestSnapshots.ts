import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useLeagueOwnership } from '@/hooks/useLeagueOwnership';

export interface QuestProgressInput {
  id: string;
  title: string;
  current: number;
  target: number;
}

export interface QuestProgressSnapshot {
  id: string;
  title: string;
  current: number;
  target: number;
  progress: number;
  completed: boolean;
}

interface QuestSnapshotRow {
  id: string;
  league_id: string;
  season: string;
  week: number;
  snapshot: QuestProgressSnapshot[];
  quest_points: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface UseQuestSnapshotsParams {
  leagueId?: string;
  season?: string;
  week?: number;
  quests: QuestProgressInput[];
}

const buildQuestProgress = (quests: QuestProgressInput[]): QuestProgressSnapshot[] =>
  quests.map((quest) => {
    const progress = Math.min(100, Math.round((quest.current / Math.max(quest.target, 1)) * 100));
    return {
      id: quest.id,
      title: quest.title,
      current: quest.current,
      target: quest.target,
      progress,
      completed: quest.current >= quest.target,
    };
  });

const getQuestPoints = (snapshot: QuestProgressSnapshot[]) =>
  snapshot.reduce((total, quest) => total + (quest.completed ? 100 : quest.progress), 0);

export const useQuestSnapshots = ({
  leagueId,
  season,
  week,
  quests,
}: UseQuestSnapshotsParams) => {
  const { user } = useAuth();
  const { canModifyLeague } = useLeagueOwnership();

  const [history, setHistory] = useState<QuestSnapshotRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const lastPersistedSignatureRef = useRef<string>('');

  const normalizedSnapshot = useMemo(() => buildQuestProgress(quests), [quests]);
  const questPoints = useMemo(() => getQuestPoints(normalizedSnapshot), [normalizedSnapshot]);
  const canPersist = Boolean(user?.id && leagueId && canModifyLeague(leagueId));

  useEffect(() => {
    if (!leagueId || !season) {
      setHistory([]);
      return;
    }

    let active = true;
    const loadSnapshots = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('gamification_quest_snapshots')
          .select('*')
          .eq('league_id', leagueId)
          .eq('season', season)
          .order('week', { ascending: false })
          .limit(8);

        if (error) throw error;
        if (!active) return;
        const rows = (data || []) as unknown as QuestSnapshotRow[];
        setHistory(rows);

        const current = typeof week === 'number' ? rows.find((row) => row.week === week) : null;
        if (current) {
          const signature = JSON.stringify({
            leagueId,
            season,
            week: current.week,
            snapshot: current.snapshot,
            questPoints: current.quest_points,
          });
          lastPersistedSignatureRef.current = signature;
        }
      } catch (error) {
        console.error('Failed to load quest snapshots:', error);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadSnapshots();
    return () => {
      active = false;
    };
  }, [leagueId, season, week]);

  useEffect(() => {
    if (!canPersist || !leagueId || !season || typeof week !== 'number' || normalizedSnapshot.length === 0) {
      return;
    }

    const signature = JSON.stringify({
      leagueId,
      season,
      week,
      snapshot: normalizedSnapshot,
      questPoints,
    });

    if (signature === lastPersistedSignatureRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsSaving(true);
      setSaveError(null);
      try {
        const { data, error } = await supabase
          .from('gamification_quest_snapshots')
          .upsert(
            {
              league_id: leagueId,
              season,
              week,
              snapshot: normalizedSnapshot as unknown as Json,
              quest_points: questPoints,
              created_by: user?.id || null,
            },
            { onConflict: 'league_id,season,week' }
          )
          .select('*')
          .single();

        if (error) throw error;

        const savedRow = data as unknown as QuestSnapshotRow;
        setHistory((previous) => {
          const withoutCurrent = previous.filter(
            (row) => !(row.league_id === savedRow.league_id && row.season === savedRow.season && row.week === savedRow.week)
          );
          return [savedRow, ...withoutCurrent].sort((left, right) => right.week - left.week).slice(0, 8);
        });

        lastPersistedSignatureRef.current = signature;
      } catch (error) {
        console.error('Failed to save quest snapshot:', error);
        setSaveError('Unable to persist quest snapshot.');
      } finally {
        setIsSaving(false);
      }
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, [canPersist, leagueId, season, week, normalizedSnapshot, questPoints, user?.id]);

  const currentSnapshot = useMemo(() => {
    if (typeof week !== 'number') {
      return null;
    }
    return history.find((snapshot) => snapshot.week === week) || null;
  }, [history, week]);

  return {
    currentSnapshot,
    history,
    isSaving,
    isLoading,
    saveError,
    canPersist,
    questPoints,
    normalizedSnapshot,
  };
};
