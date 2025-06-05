
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'dismissed_league_banners';

interface DismissedBanners {
  [leagueId: string]: {
    ownership?: boolean;
    claimPrompt?: boolean;
  };
}

export const useDismissibleBanners = () => {
  const [dismissedBanners, setDismissedBanners] = useState<DismissedBanners>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('Loaded dismissed banners from localStorage:', parsed);
        setDismissedBanners(parsed);
      }
    } catch (error) {
      console.error('Error loading dismissed banners:', error);
    }
  }, []);

  const saveToDisk = (newBanners: DismissedBanners) => {
    try {
      console.log('Saving dismissed banners to localStorage:', newBanners);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBanners));
    } catch (error) {
      console.error('Error saving dismissed banners:', error);
    }
  };

  const dismissBanner = (leagueId: string, bannerType: 'ownership' | 'claimPrompt') => {
    console.log('Dismissing banner for league', leagueId, 'type:', bannerType);
    const newBanners = {
      ...dismissedBanners,
      [leagueId]: {
        ...dismissedBanners[leagueId],
        [bannerType]: true
      }
    };
    console.log('New dismissed banners state:', newBanners);
    setDismissedBanners(newBanners);
    saveToDisk(newBanners);
  };

  const isBannerDismissed = (leagueId: string, bannerType: 'ownership' | 'claimPrompt'): boolean => {
    const dismissed = dismissedBanners[leagueId]?.[bannerType] === true;
    console.log('Checking if banner is dismissed for league', leagueId, 'type:', bannerType, 'result:', dismissed);
    return dismissed;
  };

  const resetLeagueBanners = (leagueId: string) => {
    console.log('Resetting banners for league:', leagueId);
    const newBanners = { ...dismissedBanners };
    delete newBanners[leagueId];
    setDismissedBanners(newBanners);
    saveToDisk(newBanners);
  };

  return {
    dismissBanner,
    isBannerDismissed,
    resetLeagueBanners
  };
};
