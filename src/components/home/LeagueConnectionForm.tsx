import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users as UserGroup, Loader2, ArrowLeft, Zap, Link2 } from 'lucide-react';
import { HowToFindLeagueId } from './HowToFindLeagueId';
import { SleeperAccountCard } from './SleeperAccountCard';
import { SleeperLeagueGrid } from './SleeperLeagueGrid';
import { validateAndSanitizeLeagueId, validateAndSanitizeUsername } from '@/utils/inputValidation';
import { detectInputType, getPlaceholderText } from '@/utils/inputDetection';
import { useToast } from '@/hooks/use-toast';

interface LeagueConnectionFormProps {
  leagueId: string;
  setLeagueId: (value: string) => void;
  username: string;
  setUsername: (value: string) => void;
  onLeagueSubmit: (leagueId?: string) => Promise<void>;
  onUsernameSubmit: (username?: string) => Promise<void>;
  onQuickLoadFirstLeague?: (username?: string) => Promise<void>;
  onSelectLeague?: (leagueId: string) => void;
  onBackToForm?: () => void;
  onRefreshLeagues?: (username?: string) => Promise<void>;
  loading: boolean;
  userLeaguesData?: { user: any; leagues: any[] } | null;
  showLeagueSelection?: boolean;
}

const LeagueConnectionForm: React.FC<LeagueConnectionFormProps> = ({
  leagueId,
  setLeagueId,
  username,
  setUsername,
  onLeagueSubmit,
  onUsernameSubmit,
  onQuickLoadFirstLeague,
  onSelectLeague,
  onBackToForm,
  onRefreshLeagues,
  loading,
  userLeaguesData,
  showLeagueSelection = false
}) => {
  const [smartInput, setSmartInput] = useState<string>('');
  const [inputError, setInputError] = useState<string>('');
  const { toast } = useToast();

  // Detect input type and provide smart hints
  const inputDetection = useMemo(() => {
    return detectInputType(smartInput);
  }, [smartInput]);

  const handleSmartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedInput = smartInput.trim();
    if (!trimmedInput) {
      setInputError('Please enter a League ID or Username');
      return;
    }

    setInputError('');
    
    // Detect input type and validate accordingly
    const detection = detectInputType(trimmedInput);
    
    if (detection.type === 'league-id') {
      const validation = validateAndSanitizeLeagueId(trimmedInput);
      if (!validation.isValid) {
        setInputError(validation.error || 'Invalid League ID');
        toast({
          title: "Invalid League ID",
          description: validation.error,
          variant: "destructive"
        });
        return;
      }
      
      // Submit with current input value
      const leagueIdValue = validation.sanitizedValue || trimmedInput;
      setLeagueId(leagueIdValue);
      await onLeagueSubmit(leagueIdValue);
      
    } else if (detection.type === 'username') {
      const validation = validateAndSanitizeUsername(trimmedInput);
      if (!validation.isValid) {
        setInputError(validation.error || 'Invalid Username');
        toast({
          title: "Invalid Username", 
          description: validation.error,
          variant: "destructive"
        });
        return;
      }
      
      // Submit with current input value
      const usernameValue = validation.sanitizedValue || trimmedInput;
      setUsername(usernameValue);
      await onUsernameSubmit(usernameValue);
      
    } else {
      setInputError('Please enter a valid League ID (15-20 digits) or Username (3-20 characters)');
      toast({
        title: "Invalid Input",
        description: "Please enter a valid League ID or Username",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSmartInput(value);
    
    // Clear error when user starts typing
    if (inputError) {
      setInputError('');
    }
  };

  // Show league selection interface
  if (showLeagueSelection && userLeaguesData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onBackToForm}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Search</span>
          </Button>
        </div>

        <SleeperAccountCard 
          user={userLeaguesData.user}
          onRefresh={() => onRefreshLeagues?.(userLeaguesData.user.username)}
          onDisconnect={onBackToForm || (() => {})}
          refreshing={loading}
        />

        <SleeperLeagueGrid
          leagues={userLeaguesData.leagues}
          onSelectLeague={onSelectLeague || (() => {})}
          loading={loading}
        />

        {onQuickLoadFirstLeague && (
          <Card className="border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-white mb-1">Quick Start</h4>
                  <p className="text-sm text-muted-foreground">
                    Load your most recent league automatically
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => onQuickLoadFirstLeague?.(userLeaguesData.user.username)}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Load First League</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Show connection form
  return (
    <div className="space-y-8">
      <Card className="border-primary/20 shadow-[0_0_50px_-12px] shadow-primary/30">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-3">
            <div className="bg-gradient-to-br from-primary to-primary-glow rounded-lg p-2.5">
              <Link2 className="w-6 h-6 text-white" />
            </div>
            <span>Connect Your League</span>
          </CardTitle>
          <CardDescription>
            Enter your League ID or Username - we'll detect which one automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSmartSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="smart-input" className="flex items-center space-x-2">
                <span>League ID or Username</span>
                {inputDetection.confidence === 'high' && (
                  <span className="text-xs text-primary font-medium">
                    {inputDetection.hint}
                  </span>
                )}
              </Label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <div className="flex-1">
                  <Input
                    id="smart-input"
                    placeholder={getPlaceholderText(inputDetection)}
                    value={smartInput}
                    onChange={handleInputChange}
                    disabled={loading}
                    className={`bg-white/5 border-primary/20 transition-all ${
                      inputError ? 'border-red-500' : 
                      inputDetection.confidence === 'high' ? 'border-primary/40' : ''
                    }`}
                    aria-invalid={!!inputError}
                    aria-describedby={inputError ? "input-error" : undefined}
                  />
                  {inputError && (
                    <p id="input-error" className="text-sm text-red-500 mt-1">
                      {inputError}
                    </p>
                  )}
                  {!inputError && inputDetection.confidence !== 'low' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {inputDetection.hint}
                    </p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  disabled={loading || !smartInput.trim()}
                  className="min-w-[120px] w-full sm:w-auto"
                  variant="default"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>
                      {inputDetection.type === 'league-id' ? 'Load League' : 
                       inputDetection.type === 'username' ? 'Find Leagues' : 'Connect'}
                    </span>
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