
import React, { useState, useEffect } from 'react';
import { useLeagueOwnershipStatus } from '@/hooks/useLeagueOwnershipStatus';
import { useLeagueOwnership } from '@/hooks/useLeagueOwnership';
import LeagueOwnershipStatusBanner from '@/components/LeagueOwnershipStatusBanner';

interface LeagueOwnershipCheckerProps {
  leagueId: string;
  leagueName?: string;
  onOwnershipChanged?: () => void;
}

const LeagueOwnershipChecker: React.FC<LeagueOwnershipCheckerProps> = ({
  leagueId,
  leagueName,
  onOwnershipChanged
}) => {
  const { checkOwnershipStatus, loading: checkingStatus } = useLeagueOwnershipStatus();
  const { claimLeague, loading: claiming } = useLeagueOwnership();
  const [ownershipStatus, setOwnershipStatus] = useState<{
    isOwned: boolean;
    ownedByCurrentUser: boolean;
    ownerInfo?: { id: string; claimed_at: string };
  }>({ isOwned: false, ownedByCurrentUser: false });

  useEffect(() => {
    if (leagueId?.trim()) {
      checkOwnershipStatus(leagueId).then(setOwnershipStatus);
    }
  }, [leagueId, checkOwnershipStatus]);

  const handleClaimLeague = async () => {
    const success = await claimLeague(leagueId);
    if (success) {
      // Refresh ownership status
      const newStatus = await checkOwnershipStatus(leagueId);
      setOwnershipStatus(newStatus);
      onOwnershipChanged?.();
    }
  };

  if (!leagueId?.trim() || checkingStatus) {
    return null;
  }

  return (
    <LeagueOwnershipStatusBanner
      leagueId={leagueId}
      leagueName={leagueName}
      ownershipStatus={ownershipStatus}
      onClaimLeague={handleClaimLeague}
      claiming={claiming}
    />
  );
};

export default LeagueOwnershipChecker;
