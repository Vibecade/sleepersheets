import { useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useRef } from 'react';

export const useUrlParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  const getLeagueFromUrl = useCallback(() => {
    return searchParams.get('league');
  }, [searchParams]);
  
  // Debounced version of setSearchParams to prevent rapid URL updates
  const debouncedSetParams = useCallback((params: URLSearchParams) => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setSearchParams(params, { replace: true });
    }, 300);
  }, [setSearchParams]);
  
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
