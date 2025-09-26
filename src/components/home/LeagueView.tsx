import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CacheIndicator } from '@/components/ui/cache-indicator';
import LeagueShareDialog from '@/components/league/LeagueShareDialog';
import OwnershipTransferDialog from '@/components/league/OwnershipTransferDialog';
import LeagueData from '@/components/LeagueData';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { CombinedLeagueData } from '@/utils/leagueApi';
import AdBanner from '@/components/ads/AdBanner';

interface LeagueViewProps {
  leagueData: CombinedLeagueData;
  onRefreshData: () => Promise<void>;
  onResyncData?: () => Promise<void>;
  onBackToLeagues: () => void;
  onOwnershipChanged: () => Promise<void>;
  ownershipStatus: {
    isOwned: boolean;
    ownedByCurrentUser: boolean;
    ownerInfo?: { id: string; claimed_at: string };
  } | null;
}

const LeagueView: React.FC<LeagueViewProps> = ({
  leagueData,
  onRefreshData,
  onResyncData,
  onBackToLeagues,
  onOwnershipChanged,
  ownershipStatus,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  // Store league ID in session storage to prevent excessive API calls on page refresh
  useEffect(() => {
    if (leagueData?.league?.league_id) {
      try {
        sessionStorage.setItem('lastLeagueId', leagueData.league.league_id);
      } catch (e) {
        console.error('Failed to store league ID in session storage:', e);
      }
    }
  }, [leagueData?.league?.league_id]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={onBackToLeagues}
          >
            ← Back to Leagues
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <LeagueShareDialog
            leagueId={leagueData.league.league_id}
            leagueName={leagueData.league.name}
          />
          
          {user && ownershipStatus?.ownedByCurrentUser && (
            <OwnershipTransferDialog
              isOpen={showTransferDialog}
              onClose={() => setShowTransferDialog(false)}
              leagueId={leagueData.league.league_id}
              onTransferComplete={() => {
                setShowTransferDialog(false);
                toast({
                  title: "Ownership Transferred",
                  description: "You no longer own this league"
                });
                onOwnershipChanged();
              }}
            />
          )}
        </div>
      </div>

      <AdBanner position="between-content" />
      
      <LeagueData 
        data={leagueData} 
        onRefreshData={onRefreshData}
        onResyncData={onResyncData}
        onOwnershipChanged={onOwnershipChanged}
      />
    </div>
  );
};

export default LeagueView;