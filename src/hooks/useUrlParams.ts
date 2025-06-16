import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

// Debounce function to prevent rapid URL updates
const debounce = (func: Function, wait: number) => {
  let timeout: number | undefined;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait) as unknown as number;
  };
};

export const useUrlParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const getLeagueFromUrl = useCallback(() => {
    return searchParams.get('league');
  }, [searchParams]);
  
  // Debounced version of setSearchParams to prevent rapid URL updates
  const debouncedSetParams = useCallback(
    debounce((params: URLSearchParams) => {
      setSearchParams(params, { replace: true });
    }, 300), // 300ms debounce
    [setSearchParams]
  );
  
  const setLeagueInUrl = useCallback((leagueId: string) => {
    const currentLeague = searchParams.get('league');
    if (currentLeague === leagueId) return; // Don't update if it's the same
    
    const params = new URLSearchParams(searchParams);
    params.set('league', leagueId);
    debouncedSetParams(params);
  }, [searchParams, debouncedSetParams]);
  
  const clearUrlParams = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);
  
  return {
    getLeagueFromUrl,
    setLeagueInUrl,
    clearUrlParams
  };
};