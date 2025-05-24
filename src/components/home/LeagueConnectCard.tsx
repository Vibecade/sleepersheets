
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Users, Zap, Shield } from 'lucide-react';
import { LeagueIdInput } from './LeagueIdInput';
import { UsernameInput } from './UsernameInput';
import { HowToFindLeagueId } from './HowToFindLeagueId';

interface LeagueConnectCardProps {
  leagueId: string;
  setLeagueId: (value: string) => void;
  username: string;
  setUsername: (value: string) => void;
  onLeagueSubmit: () => void;
  onUsernameSubmit: () => void;
  loading: boolean;
}

export const LeagueConnectCard = ({
  leagueId,
  setLeagueId,
  username,
  setUsername,
  onLeagueSubmit,
  onUsernameSubmit,
  loading
}: LeagueConnectCardProps) => {
  return (
    <div className="space-y-8">
      <Card className="fade-in hover-lift relative overflow-hidden">
        {/* Subtle background accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent"></div>
        
        <CardHeader className="text-center pb-6 relative z-10">
          <div className="mx-auto mb-6 relative">
            <div className="bg-gradient-to-br from-blue-500 via-emerald-500 to-purple-600 rounded-2xl p-4 shadow-xl w-fit mx-auto">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <CardTitle className="text-white text-3xl font-bold mb-3">
            Connect Your League
          </CardTitle>
          <CardDescription className="text-slate-300 text-lg leading-relaxed max-w-md mx-auto">
            Enter your Sleeper League ID or username to unlock powerful analytics and detailed insights
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8 relative z-10">
          <div className="space-y-8">
            <LeagueIdInput
              leagueId={leagueId}
              setLeagueId={setLeagueId}
              onSubmit={onLeagueSubmit}
              loading={loading}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-800 px-6 py-2 text-sm text-slate-400 font-medium rounded-full border border-slate-700">
                  or connect via username
                </span>
              </div>
            </div>

            <UsernameInput
              username={username}
              setUsername={setUsername}
              onSubmit={onUsernameSubmit}
              loading={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Trust indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="glass text-center p-4 rounded-xl">
          <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <div className="text-sm font-medium text-white">Instant Access</div>
          <div className="text-xs text-slate-400">Connect in seconds</div>
        </div>
        <div className="glass text-center p-4 rounded-xl">
          <Shield className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <div className="text-sm font-medium text-white">Secure</div>
          <div className="text-xs text-slate-400">Read-only access</div>
        </div>
        <div className="glass text-center p-4 rounded-xl">
          <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <div className="text-sm font-medium text-white">All Leagues</div>
          <div className="text-xs text-slate-400">Full league support</div>
        </div>
      </div>

      <HowToFindLeagueId />
    </div>
  );
};
