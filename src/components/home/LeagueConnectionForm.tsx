
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Users as UserGroup, Search as MagnifyingGlass, Loader2 } from 'lucide-react';
import { HowToFindLeagueId } from './HowToFindLeagueId';
import { validateAndSanitizeLeagueId, validateAndSanitizeUsername } from '@/utils/enhancedInputValidation';
import { useToast } from '@/hooks/use-toast';

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
  const [leagueIdError, setLeagueIdError] = useState<string>('');
  const [usernameError, setUsernameError] = useState<string>('');
  const { toast } = useToast();

  const handleLeagueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateAndSanitizeLeagueId(leagueId);
    if (!validation.isValid) {
      setLeagueIdError(validation.error || 'Invalid league ID');
      toast({
        title: "Invalid League ID",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }
    
    setLeagueIdError('');
    if (validation.sanitizedValue && validation.sanitizedValue !== leagueId) {
      setLeagueId(validation.sanitizedValue);
    }
    
    await onLeagueSubmit();
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateAndSanitizeUsername(username);
    if (!validation.isValid) {
      setUsernameError(validation.error || 'Invalid username');
      toast({
        title: "Invalid Username",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }
    
    setUsernameError('');
    if (validation.sanitizedValue && validation.sanitizedValue !== username) {
      setUsername(validation.sanitizedValue);
    }
    
    await onUsernameSubmit();
  };

  const handleLeagueIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLeagueId(value);
    
    // Clear error when user starts typing
    if (leagueIdError) {
      setLeagueIdError('');
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    
    // Clear error when user starts typing
    if (usernameError) {
      setUsernameError('');
    }
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
                <div className="flex-1">
                  <Input
                    id="league-id"
                    placeholder="Enter your Sleeper League ID"
                    value={leagueId}
                    onChange={handleLeagueIdChange}
                    disabled={loading}
                    className={`bg-white/5 border-yellow-500/20 ${leagueIdError ? 'border-red-500' : ''}`}
                    aria-invalid={!!leagueIdError}
                    aria-describedby={leagueIdError ? "league-id-error" : undefined}
                  />
                  {leagueIdError && (
                    <p id="league-id-error" className="text-sm text-red-500 mt-1">
                      {leagueIdError}
                    </p>
                  )}
                </div>
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
                <div className="flex-1">
                  <Input
                    id="username"
                    placeholder="Enter your Sleeper username"
                    value={username}
                    onChange={handleUsernameChange}
                    disabled={loading}
                    className={`bg-white/5 border-yellow-500/20 ${usernameError ? 'border-red-500' : ''}`}
                    aria-invalid={!!usernameError}
                    aria-describedby={usernameError ? "username-error" : undefined}
                  />
                  {usernameError && (
                    <p id="username-error" className="text-sm text-red-500 mt-1">
                      {usernameError}
                    </p>
                  )}
                </div>
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
