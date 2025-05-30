
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLeagueOwnership } from '@/hooks/useLeagueOwnership';
import { Shield, ShieldCheck, User, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LeagueOwnershipBannerProps {
  leagueId: string;
  leagueName: string;
}

const LeagueOwnershipBanner: React.FC<LeagueOwnershipBannerProps> = ({ 
  leagueId, 
  leagueName 
}) => {
  const { user } = useAuth();
  const { isLeagueOwned, claimLeague, loading } = useLeagueOwnership();
  const navigate = useNavigate();

  const owned = isLeagueOwned(leagueId);

  const handleClaimLeague = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    await claimLeague(leagueId);
  };

  if (!user) {
    return (
      <Card className="border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <LogIn className="w-5 h-5 text-yellow-500" />
              <div>
                <h3 className="font-semibold text-white">Protect Your League Settings</h3>
                <p className="text-sm text-gray-300">
                  Sign in to claim this league and prevent others from modifying your data
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (owned) {
    return (
      <Card className="border-green-500/30 bg-gradient-to-r from-green-500/10 to-emerald-500/10 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            <div>
              <h3 className="font-semibold text-white">League Protected</h3>
              <p className="text-sm text-gray-300">
                You own this league. Your settings are protected from unauthorized changes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="font-semibold text-white">Claim This League</h3>
              <p className="text-sm text-gray-300">
                Protect your salary cap and contract settings by claiming ownership of "{leagueName}"
              </p>
            </div>
          </div>
          <Button 
            onClick={handleClaimLeague}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {loading ? 'Claiming...' : 'Claim League'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeagueOwnershipBanner;
