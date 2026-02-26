import React from 'react';
import { Sparkles } from 'lucide-react';
import GamificationHub from '@/components/GamificationHub';

interface GamificationCenterProps {
  league: any;
  rosters: any[];
  players: Record<string, any>;
  userMap: Record<string, any>;
  transactions: any[];
}

const GamificationCenter: React.FC<GamificationCenterProps> = ({
  league,
  rosters,
  players,
  userMap,
  transactions,
}) => {
  return (
    <div className="section-stack">
      <div className="glass-card rounded-xl border border-border/50 p-4 section-sticky-header">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">Gamification</h2>
            <p className="text-sm text-muted-foreground">
              Weekly quests, rivalry pressure, and market momentum tailored to this league.
            </p>
          </div>
        </div>
      </div>

      <GamificationHub
        league={league}
        rosters={rosters}
        players={players}
        userMap={userMap}
        transactions={transactions}
      />
    </div>
  );
};

export default GamificationCenter;
