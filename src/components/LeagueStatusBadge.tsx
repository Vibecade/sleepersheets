import React, { useState, useEffect, useCallback } from 'react';
import { useLeagueOwnershipStatus } from '@/hooks/useLeagueOwnershipStatus';
import { useLeagueOwnership } from '@/hooks/useLeagueOwnership';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { logger } from '@/utils/logger';

interface OwnershipStatus {
  isOwned: boolean;
  ownedByCurrentUser: boolean;
}

interface LeagueStatusBadgeProps {
  leagueId: string;
  onOwnershipChanged?: () => void;
}

// Cache for ownership status to prevent repeated checks
const statusCache = new Map<string, OwnershipStatus>();

const LeagueStatusBadge: React.FC<LeagueStatusBadgeProps> = ({ leagueId, onOwnershipChanged }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const { checkOwnershipStatus, loading: checkingStatus, clearOwnershipStatusCache } = useLeagueOwnershipStatus();
    const { claimLeague, loading: claiming, clearOwnedLeaguesCache } = useLeagueOwnership();
    const [status, setStatus] = useState<OwnershipStatus | null>(null);
    const [lastCheckedLeagueId, setLastCheckedLeagueId] = useState<string>('');

    const fetchStatus = useCallback(async () => {
        if (!leagueId || leagueId === lastCheckedLeagueId) return;
        
        // Check cache first
        if (statusCache.has(leagueId)) {
            logger.debug('Using cached badge status for:', leagueId);
            setStatus(statusCache.get(leagueId)!);
            setLastCheckedLeagueId(leagueId);
            return;
        }
        
        const newStatus = await checkOwnershipStatus(leagueId);
        setStatus(newStatus);
        setLastCheckedLeagueId(leagueId);
        
        // Cache the result
        statusCache.set(leagueId, newStatus);
    }, [leagueId, checkOwnershipStatus, lastCheckedLeagueId]);

    useEffect(() => {
        if (leagueId && leagueId !== lastCheckedLeagueId) {
            fetchStatus();
        }
    }, [leagueId, fetchStatus, lastCheckedLeagueId]);

    const handleClaim = async () => {
        if (!user) {
            toast({
                title: "Authentication Required",
                description: "Please sign in to claim a league.",
                variant: "destructive",
            });
            return;
        }
        const result = await claimLeague(leagueId);
        if (result.success) {
            // Update badge cache
            statusCache.set(leagueId, { isOwned: true, ownedByCurrentUser: true });
            // Clear both ownership caches to ensure full synchronization
            clearOwnedLeaguesCache();
            clearOwnershipStatusCache(leagueId);
            onOwnershipChanged?.();
        }
        await fetchStatus();
    };

    if (checkingStatus || !status) {
        return null;
    }

    // Already-claimed leagues used to render a golden "Claimed" pill (or
    // an emerald "You Own This" pill for the owner). Both were leftover
    // artifacts from an earlier ownership-clarity pass — neither is
    // actionable, both add visual noise above the page header, and the
    // commissioner-only features already hide themselves for non-owners.
    // Only render the badge when there's something to do: claim the league.
    if (status.ownedByCurrentUser || status.isOwned) {
        return null;
    }

    const badgeText = claiming ? "Claiming..." : "Claim League";
    const tooltipText = "Click to claim this league and protect its settings.";
    const className = claiming
        ? "cursor-not-allowed opacity-50"
        : "cursor-pointer hover:bg-white/20";
    const onClick = claiming ? undefined : handleClaim;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge variant="secondary" onClick={onClick} className={className}>
                        {badgeText}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default LeagueStatusBadge;