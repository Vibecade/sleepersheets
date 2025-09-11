import { useState, useEffect, useCallback } from 'react';
import { getCurrentNFLWeek, getWeekInfo, clearNFLStateCache, type WeekInfo } from '@/utils/nflState';

export const useNFLWeek = (enableTuesdayTransition: boolean = true) => {
  const [currentWeekInfo, setCurrentWeekInfo] = useState<WeekInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentWeek = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const weekInfo = await getCurrentNFLWeek(enableTuesdayTransition);
      setCurrentWeekInfo(weekInfo);
    } catch (err) {
      console.error('Error fetching NFL week:', err);
      setError('Failed to fetch current NFL week');
    } finally {
      setLoading(false);
    }
  }, [enableTuesdayTransition]);

  const refreshWeekData = useCallback(async () => {
    clearNFLStateCache();
    await fetchCurrentWeek();
  }, [fetchCurrentWeek]);

  const getSpecificWeekInfo = useCallback(async (week: number): Promise<WeekInfo | null> => {
    try {
      return await getWeekInfo(week);
    } catch (err) {
      console.error('Error fetching week info:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchCurrentWeek();

    // Refresh data every 30 minutes
    const interval = setInterval(fetchCurrentWeek, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchCurrentWeek]);

  return {
    currentWeekInfo,
    loading,
    error,
    refreshWeekData,
    getSpecificWeekInfo,
    currentNFLWeek: currentWeekInfo?.currentNFLWeek || 1,
    displayWeek: currentWeekInfo?.displayWeek || 1,
    seasonType: currentWeekInfo?.seasonType || 'regular',
    season: currentWeekInfo?.season || '2024'
  };
};