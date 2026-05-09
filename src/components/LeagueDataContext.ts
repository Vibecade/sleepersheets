import { createContext, useContext } from 'react';
import type { SleeperLeagueDataContextValue } from '@/types/sleeper';

export const LeagueDataContext = createContext<SleeperLeagueDataContextValue | null>(null);

export const useLeagueData = () => {
  const context = useContext(LeagueDataContext);

  if (!context) {
    throw new Error('useLeagueData must be used within a LeagueDataProvider');
  }

  return context;
};
