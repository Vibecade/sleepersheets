import React, { useState, useEffect, useCallback } from 'react';
import { useLeagueOwnershipStatus } from '@/hooks/useLeagueOwnershipStatus';
import { useLeagueOwnership } from '@/hooks/useLeagueOwnership';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

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
    const { checkOwnershipStatus, loading: checkingStatus } = useLeagueOwnershipStatus();
    const { claimLeague, loading: claiming, clearOwnedLeaguesCache } = useLeagueOwnership();
    const [status, setStatus] = useState<OwnershipStatus | null>(null);
    const [lastCheckedLeagueId, setLastCheckedLeagueId] = useState<string>('');

    const fetchStatus = useCallback(async () => {
        if (!leagueId || leagueId === lastCheckedLeagueId) return;
        
        // Check cache first
        if (statusCache.has(leagueId)) {
            console.log('Using cached badge status for:', leagueId);
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
            // Clear the useLeagueOwnership cache to synchronize ownership state
            clearOwnedLeaguesCache();
            onOwnershipChanged?.();
        }
        await fetchStatus();
    };

    if (checkingStatus || !status) {
        return <Skeleton className="h-7 w-28 rounded-full" />;
    }

    let badgeText: string;
    let tooltipText: string;
    let variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' = 'secondary';
    let onClick: (() => void) | undefined;
    let className = '';

    if (status.ownedByCurrentUser) {
        badgeText = "You Own This";
        tooltipText = "You have full editing permissions for this league.";
        variant = "default";
    } else if (status.isOwned) {
        badgeText = "Claimed";
        tooltipText = "This league is owned by another user. You have view-only permissions.";
        variant = "warning";
    } else {
        badgeText = claiming ? "Claiming..." : "Claim League";
        tooltipText = "Click to claim this league and protect its settings.";
        variant = "secondary";
        if (claiming) {
            className = "cursor-not-allowed opacity-50";
            onClick = undefined;
        } else {
            className = "cursor-pointer hover:bg-white/20";
            onClick = handleClaim;
        }
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge variant={variant} onClick={onClick} className={className}>
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