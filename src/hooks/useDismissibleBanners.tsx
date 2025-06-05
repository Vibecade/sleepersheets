
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
        setDismissedBanners(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading dismissed banners:', error);
    }
  }, []);

  const saveToDisk = (newBanners: DismissedBanners) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBanners));
    } catch (error) {
      console.error('Error saving dismissed banners:', error);
    }
  };

  const dismissBanner = (leagueId: string, bannerType: 'ownership' | 'claimPrompt') => {
    const newBanners = {
      ...dismissedBanners,
      [leagueId]: {
        ...dismissedBanners[leagueId],
        [bannerType]: true
      }
    };
    setDismissedBanners(newBanners);
    saveToDisk(newBanners);
  };

  const isBannerDismissed = (leagueId: string, bannerType: 'ownership' | 'claimPrompt'): boolean => {
    return dismissedBanners[leagueId]?.[bannerType] === true;
  };

  const resetLeagueBanners = (leagueId: string) => {
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
