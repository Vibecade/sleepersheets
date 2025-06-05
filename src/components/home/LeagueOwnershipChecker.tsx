
import React, { useState, useEffect } from 'react';
import { useLeagueOwnershipStatus } from '@/hooks/useLeagueOwnershipStatus';
import { useLeagueOwnership } from '@/hooks/useLeagueOwnership';
import { useAuth } from '@/contexts/AuthContext';
import LeagueOwnershipStatusBanner from '@/components/LeagueOwnershipStatusBanner';
import { validateAndSanitizeLeagueId } from '@/utils/enhancedInputValidation';
import { useToast } from '@/hooks/use-toast';
import { useDismissibleBanners } from '@/hooks/useDismissibleBanners';

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
  const { user } = useAuth();
  const { checkOwnershipStatus, loading: checkingStatus } = useLeagueOwnershipStatus();
  const { claimLeague, loading: claiming } = useLeagueOwnership();
  const { toast } = useToast();
  const { resetLeagueBanners, dismissBanner, isBannerDismissed } = useDismissibleBanners();
  
  const [ownershipStatus, setOwnershipStatus] = useState<{
    isOwned: boolean;
    ownedByCurrentUser: boolean;
    ownerInfo?: { id: string; claimed_at: string };
  }>({ isOwned: false, ownedByCurrentUser: false });

  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    const validateAndCheck = async () => {
      if (!leagueId?.trim()) {
        setValidationError('');
        return;
      }

      // Validate league ID before making API calls
      const validation = validateAndSanitizeLeagueId(leagueId);
      if (!validation.isValid) {
        setValidationError(validation.error || 'Invalid league ID');
        return;
      }

      setValidationError('');
      
      try {
        const status = await checkOwnershipStatus(leagueId);
        console.log('Ownership status for league', leagueId, ':', status);
        setOwnershipStatus(status);
      } catch (error) {
        console.error('Error checking ownership status:', error);
        toast({
          title: "Error",
          description: "Failed to check league ownership status",
          variant: "destructive"
        });
      }
    };

    validateAndCheck();
  }, [leagueId, checkOwnershipStatus, toast]);

  const handleClaimLeague = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to claim a league",
        variant: "destructive"
      });
      return;
    }

    // Validate league ID before claiming
    const validation = validateAndSanitizeLeagueId(leagueId);
    if (!validation.isValid) {
      toast({
        title: "Invalid League ID",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Attempting to claim league:', leagueId);
      const result = await claimLeague(leagueId);
      console.log('Claim result:', result);
      
      // Always refresh ownership status after a claim attempt
      const newStatus = await checkOwnershipStatus(leagueId);
      console.log('New ownership status after claim attempt:', newStatus);
      setOwnershipStatus(newStatus);
      
      // If we get alreadyClaimed (409 error), dismiss the claim prompt for this league
      if (result.alreadyClaimed) {
        console.log('League already claimed, dismissing claimPrompt banner for league:', leagueId);
        dismissBanner(leagueId, 'claimPrompt');
        // Force a re-render by updating state
        setOwnershipStatus(prev => ({ ...prev }));
      }
      
      // Reset banner preferences when ownership changes successfully
      if (result.success) {
        resetLeagueBanners(leagueId);
        onOwnershipChanged?.();
      }
    } catch (error) {
      console.error('Error claiming league:', error);
      toast({
        title: "Error",
        description: "Failed to claim league",
        variant: "destructive"
      });
    }
  };

  // Don't render if league ID is invalid or empty
  if (!leagueId?.trim() || validationError || checkingStatus) {
    return null;
  }

  // Add debug logging for banner dismissal state
  const claimPromptDismissed = isBannerDismissed(leagueId, 'claimPrompt');
  const ownershipDismissed = isBannerDismissed(leagueId, 'ownership');
  
  console.log('Banner dismissal state for league', leagueId, ':', {
    claimPromptDismissed,
    ownershipDismissed,
    ownershipStatus
  });

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
