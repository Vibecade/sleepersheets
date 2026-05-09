import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowLeft, Zap, Link2 } from 'lucide-react';
import { HowToFindLeagueId } from './HowToFindLeagueId';
import { SleeperAccountCard } from './SleeperAccountCard';
import { SleeperLeagueGrid } from './SleeperLeagueGrid';
import { validateAndSanitizeLeagueId, validateAndSanitizeUsername } from '@/utils/inputValidation';
import { UnifiedLoading } from '@/components/ui/unified-loading';
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

  // Scroll to top when component mounts (defensive measure)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
    const leagueCount = userLeaguesData.leagues.length;
    return (
      <div className="space-y-6 sm:space-y-8">
        <button
          type="button"
          onClick={onBackToForm}
          className="inline-flex items-center gap-2 text-primary hover:text-primary-glow font-mono font-semibold uppercase transition-colors"
          style={{ fontSize: 11, letterSpacing: '0.15em' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO SEARCH
        </button>

        {/* PICK YOUR BATTLEFIELD hero */}
        <div>
          <div
            className="font-mono font-semibold text-primary mb-2"
            style={{ fontSize: 11, letterSpacing: '0.25em' }}
          >
            ● 01 / SELECT A LEAGUE
          </div>
          <h1
            className="font-headline font-bold uppercase text-foreground m-0"
            style={{
              fontSize: 'clamp(36px, 6vw, 72px)',
              letterSpacing: '-0.01em',
              lineHeight: 0.92,
            }}
          >
            Pick your
            <br />
            <span className="text-primary">battlefield.</span>
          </h1>
          <div
            className="mt-3 font-mono text-muted-foreground"
            style={{ fontSize: 12, letterSpacing: '0.1em' }}
          >
            {leagueCount} {leagueCount === 1 ? 'LEAGUE' : 'LEAGUES'} SYNCED FROM SLEEPER
          </div>
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

        {/* Add another league prompt */}
        <button
          type="button"
          onClick={onBackToForm}
          className="w-full bg-card text-left px-5 py-4 sm:px-6 flex items-center gap-4 hover:border-primary/40 transition-colors"
          style={{ border: '1px dashed hsl(var(--border-light))' }}
        >
          <span
            className="flex items-center justify-center text-primary font-headline font-bold flex-shrink-0"
            style={{
              width: 40,
              height: 40,
              fontSize: 22,
              border: '1px solid hsl(var(--border-light))',
            }}
          >
            +
          </span>
          <div className="flex-1 min-w-0">
            <div
              className="font-headline font-bold uppercase text-foreground"
              style={{ fontSize: 16, letterSpacing: '0.1em' }}
            >
              Add Another League
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Paste a Sleeper league ID or username to connect another league.
            </div>
          </div>
          <span
            className="hidden sm:inline-flex font-mono font-bold text-primary flex-shrink-0"
            style={{ fontSize: 11, letterSpacing: '0.15em' }}
          >
            CONNECT →
          </span>
        </button>

        {onQuickLoadFirstLeague && (
          <div
            className="bg-card border border-border px-5 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-4"
            style={{ background: 'hsl(var(--card-light))' }}
          >
            <span className="text-primary text-2xl flex-shrink-0">
              <Zap className="w-6 h-6" />
            </span>
            <div className="flex-1 min-w-0">
              <div
                className="font-headline font-bold uppercase text-foreground"
                style={{ fontSize: 14, letterSpacing: '0.1em' }}
              >
                Quick Start
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Load your most recent league automatically.
              </div>
            </div>
            <button
              type="button"
              onClick={() => onQuickLoadFirstLeague?.(userLeaguesData.user.username)}
              disabled={loading}
              className="bg-primary text-primary-foreground font-headline font-bold uppercase px-5 py-3 hover:bg-primary-glow transition-colors disabled:opacity-60"
              style={{ fontSize: 12, letterSpacing: '0.15em' }}
            >
              LOAD FIRST LEAGUE →
            </button>
          </div>
        )}
      </div>
    );
  }

  // Show connection form
  return (
    <div className="space-y-8 relative">
      {loading && !showLeagueSelection && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
          <Card className="p-8 border-primary/20">
            <UnifiedLoading variant="text" size="lg" />
          </Card>
        </div>
      )}
      
      <div
        className="bg-card border border-border px-5 py-6 sm:px-7 sm:py-8"
        style={{ borderTop: '2px solid hsl(var(--primary))' }}
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <div
            className="flex items-center justify-center bg-primary"
            style={{
              width: 44,
              height: 44,
              clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)',
            }}
          >
            <Link2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <h2
            className="font-headline font-bold uppercase text-foreground m-0"
            style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', letterSpacing: '0.05em' }}
          >
            Connect Your League
          </h2>
        </div>
        <p className="text-center text-sm text-muted-foreground mb-6">
          Enter your League ID or Username — we'll detect which one automatically
        </p>

        <form onSubmit={handleSmartSubmit}>
          <div className="space-y-2">
            <Label
              htmlFor="smart-input"
              className="flex items-center gap-2 font-headline font-bold uppercase text-foreground"
              style={{ fontSize: 12, letterSpacing: '0.15em' }}
            >
              <span>League ID or Username</span>
              {inputDetection.confidence === 'high' && (
                <span
                  className="font-mono text-primary"
                  style={{ fontSize: 10, letterSpacing: '0.1em' }}
                >
                  {inputDetection.hint}
                </span>
              )}
            </Label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <div className="flex-1">
                <Input
                  id="smart-input"
                  placeholder={getPlaceholderText(inputDetection)}
                  value={smartInput}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`h-12 bg-background font-mono transition-all sm:border-r-0 ${
                    inputError
                      ? 'border-secondary'
                      : inputDetection.confidence === 'high'
                      ? 'border-primary/40'
                      : ''
                  }`}
                  aria-invalid={!!inputError}
                  aria-describedby={inputError ? 'input-error' : undefined}
                />
                {inputError && (
                  <p id="input-error" className="text-sm text-secondary mt-1">
                    {inputError}
                  </p>
                )}
                {!inputError && inputDetection.confidence !== 'low' && (
                  <p className="text-xs text-muted-foreground mt-1">{inputDetection.hint}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !smartInput.trim()}
                className="h-12 px-6 sm:px-8 bg-primary text-primary-foreground font-headline font-bold uppercase hover:bg-primary-glow transition-colors disabled:opacity-60"
                style={{ fontSize: 14, letterSpacing: '0.15em' }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : inputDetection.type === 'league-id' ? (
                  'LOAD →'
                ) : inputDetection.type === 'username' ? (
                  'FIND →'
                ) : (
                  'CONNECT →'
                )}
              </button>
            </div>
          </div>
          <div
            className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-muted-foreground"
            style={{ fontSize: 10, letterSpacing: '0.15em' }}
          >
            <span>● READ-ONLY ACCESS</span>
            <span>● NO SLEEPER LOGIN NEEDED</span>
            <span>● INSTANT SYNC</span>
          </div>
        </form>
      </div>

      <HowToFindLeagueId />
    </div>
  );
};

export default LeagueConnectionForm;