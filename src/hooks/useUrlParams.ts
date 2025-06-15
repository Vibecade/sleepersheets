
import { useSearchParams } from 'react-router-dom';

export const useUrlParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const getLeagueFromUrl = () => {
    return searchParams.get('league');
  };
  
  const setLeagueInUrl = (leagueId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('league', leagueId);
    setSearchParams(params);
  };
  
  const clearUrlParams = () => {
    setSearchParams({});
  };
  
  return {
    getLeagueFromUrl,
    setLeagueInUrl,
    clearUrlParams
  };
};
