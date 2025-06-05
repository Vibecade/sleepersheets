
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ShieldCheck, ShieldX, User, LogIn, Clock, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useDismissibleBanners } from '@/hooks/useDismissibleBanners';

interface OwnershipStatus {
  isOwned: boolean;
  ownedByCurrentUser: boolean;
  ownerInfo?: {
    id: string;
    claimed_at: string;
  };
}

interface LeagueOwnershipStatusBannerProps {
  leagueId: string;
  leagueName?: string;
  ownershipStatus: OwnershipStatus;
  onClaimLeague?: () => void;
  claiming?: boolean;
}

const LeagueOwnershipStatusBanner: React.FC<LeagueOwnershipStatusBannerProps> = ({
  leagueId,
  leagueName,
  ownershipStatus,
  onClaimLeague,
  claiming = false
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isOwned, ownedByCurrentUser, ownerInfo } = ownershipStatus;
  const { dismissBanner, isBannerDismissed } = useDismissibleBanners();

  // User owns the league - always show this, no dismiss option
  if (isOwned && ownedByCurrentUser) {
    return (
      <Card className="border-green-500/30 bg-gradient-to-r from-green-500/10 to-emerald-500/10 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            <div>
              <h3 className="font-semibold text-white">You Own This League</h3>
              <p className="text-sm text-gray-300">
                Your league settings are protected. You have full editing permissions.
                {ownerInfo && (
                  <span className="block mt-1 text-xs text-gray-400">
                    Claimed {formatDistanceToNow(new Date(ownerInfo.claimed_at))} ago
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // League is owned by someone else - dismissible
  if (isOwned && !ownedByCurrentUser) {
    if (isBannerDismissed(leagueId, 'ownership')) {
      return null;
    }

    return (
      <Card className="border-red-500/30 bg-gradient-to-r from-red-500/10 to-pink-500/10 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShieldX className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="font-semibold text-white">League Already Claimed</h3>
                <p className="text-sm text-gray-300">
                  This league is owned by another user. You can view the data but cannot modify settings.
                  {ownerInfo && (
                    <span className="block mt-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Claimed {formatDistanceToNow(new Date(ownerInfo.claimed_at))} ago
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissBanner(leagueId, 'ownership')}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // League is not owned by anyone - check authentication status
  if (!isOwned) {
    // Not authenticated - prompt to sign in - dismissible
    if (!user) {
      if (isBannerDismissed(leagueId, 'claimPrompt')) {
        return null;
      }

      return (
        <Card className="border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <LogIn className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="font-semibold text-white">Sign In to Claim This League</h3>
                  <p className="text-sm text-gray-300">
                    Protect your league settings by signing in and claiming ownership
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={() => navigate('/auth')}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Sign In
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissBanner(leagueId, 'claimPrompt')}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Authenticated and league is available to claim (not owned by anyone) - dismissible
    if (isBannerDismissed(leagueId, 'claimPrompt')) {
      return null;
    }

    return (
      <Card className="border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-yellow-500" />
              <div>
                <h3 className="font-semibold text-white">League Available to Claim</h3>
                <p className="text-sm text-gray-300">
                  {leagueName ? `Claim "${leagueName}"` : 'Claim this league'} to protect your settings and prevent unauthorized changes
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {onClaimLeague && (
                <Button 
                  onClick={onClaimLeague}
                  disabled={claiming}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                >
                  {claiming ? 'Claiming...' : 'Claim League'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissBanner(leagueId, 'claimPrompt')}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback - should not reach here
  return null;
};

export default LeagueOwnershipStatusBanner;
