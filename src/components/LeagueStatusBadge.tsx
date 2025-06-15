
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

const LeagueStatusBadge: React.FC<LeagueStatusBadgeProps> = ({ leagueId, onOwnershipChanged }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const { checkOwnershipStatus, loading: checkingStatus } = useLeagueOwnershipStatus();
    const { claimLeague, loading: claiming } = useLeagueOwnership();
    const [status, setStatus] = useState<OwnershipStatus | null>(null);

    const fetchStatus = useCallback(async () => {
        if (leagueId) {
            const newStatus = await checkOwnershipStatus(leagueId);
            setStatus(newStatus);
        }
    }, [leagueId, checkOwnershipStatus]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

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
        className = "cursor-pointer hover:bg-white/20";
        onClick = handleClaim;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge variant={variant} onClick={onClick} disabled={claiming} className={className}>
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
