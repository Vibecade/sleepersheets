
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Users as UserGroup, Search as MagnifyingGlass, Loader2 } from 'lucide-react';
import { HowToFindLeagueId } from './HowToFindLeagueId';

interface LeagueConnectionFormProps {
  leagueId: string;
  setLeagueId: (value: string) => void;
  username: string;
  setUsername: (value: string) => void;
  onLeagueSubmit: () => Promise<void>;
  onUsernameSubmit: () => Promise<void>;
  loading: boolean;
}

const LeagueConnectionForm: React.FC<LeagueConnectionFormProps> = ({
  leagueId,
  setLeagueId,
  username,
  setUsername,
  onLeagueSubmit,
  onUsernameSubmit,
  loading
}) => {
  const handleLeagueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLeagueSubmit();
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUsernameSubmit();
  };

  return (
    <div className="space-y-8">
      <Card className="border-yellow-500/20 shadow-[0_0_50px_-12px] shadow-yellow-500/30">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-3">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-2.5">
              <UserGroup className="w-6 h-6 text-white" />
            </div>
            <span>Connect Your League</span>
          </CardTitle>
          <CardDescription>
            Enter your Sleeper League ID or username to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLeagueSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="league-id">League ID</Label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Input
                  id="league-id"
                  placeholder="Enter your Sleeper League ID"
                  value={leagueId}
                  onChange={(e) => setLeagueId(e.target.value)}
                  disabled={loading}
                  className="bg-white/5 border-yellow-500/20 flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={loading || !leagueId.trim()}
                  className="min-w-[100px] w-full sm:w-auto"
                  variant="default"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Load League</span>
                  )}
                </Button>
              </div>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Input
                  id="username"
                  placeholder="Enter your Sleeper username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="bg-white/5 border-yellow-500/20 flex-1"
                />
                <Button 
                  type="submit" 
                  variant="outline"
                  disabled={loading || !username.trim()}
                  className="min-w-[100px] w-full sm:w-auto"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <MagnifyingGlass className="w-4 h-4 mr-2" />
                      <span className="hidden xs:inline">Find Leagues</span>
                      <span className="xs:hidden">Find</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <HowToFindLeagueId />
    </div>
  );
};

export default LeagueConnectionForm;
