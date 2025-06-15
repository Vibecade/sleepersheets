import React from 'react';
import { Button } from '@/components/ui/button';
import { CacheIndicator } from '@/components/ui/cache-indicator';
import LeagueShareDialog from '@/components/league/LeagueShareDialog';
import OwnershipTransferDialog from '@/components/league/OwnershipTransferDialog';
import LeagueData from '@/components/LeagueData';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { CombinedLeagueData } from '@/utils/leagueApi';

interface LeagueViewProps {
  leagueData: CombinedLeagueData;
  onRefreshData: () => Promise<void>;
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
  onBackToLeagues,
  onOwnershipChanged,
  ownershipStatus,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

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
              leagueId={leagueData.league.league_id}
              leagueName={leagueData.league.name}
              onTransferComplete={() => {
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

      <LeagueData 
        data={leagueData} 
        onRefreshData={onRefreshData}
        onOwnershipChanged={onOwnershipChanged}
      />
    </div>
  );
};

export default LeagueView;
