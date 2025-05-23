
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Users } from 'lucide-react';
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
    <Card className="fade-in hover-lift gradient-border">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center space-x-3 text-white text-2xl">
          <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-2">
            <Users className="w-6 h-6 text-white" />
          </div>
          <span>Connect Your League</span>
        </CardTitle>
        <CardDescription className="text-gray-300 text-lg">
          Enter your Sleeper League ID or username to unlock powerful analytics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-6">
          <LeagueIdInput
            leagueId={leagueId}
            setLeagueId={setLeagueId}
            onSubmit={onLeagueSubmit}
            loading={loading}
          />

          <div className="flex items-center space-x-4">
            <Separator className="flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <span className="text-sm text-gray-400 font-medium px-4 py-2 glass rounded-full">or</span>
            <Separator className="flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>

          <UsernameInput
            username={username}
            setUsername={setUsername}
            onSubmit={onUsernameSubmit}
            loading={loading}
          />
        </div>

        <HowToFindLeagueId />
      </CardContent>
    </Card>
  );
};
