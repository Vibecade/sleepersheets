import React from 'react';
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { WeeklyPerformance } from './WeeklyPerformanceIndicators';

interface MobileWeeklyPerformanceProps {
  weeklyData: WeeklyPerformance[];
  weeklyAverages: Record<number, number>;
  isExpanded: boolean;
  onToggle: () => void;
  rosterId: number;
}

export const MobileWeeklyPerformance: React.FC<MobileWeeklyPerformanceProps> = ({
  weeklyData,
  weeklyAverages,
  isExpanded,
  onToggle,
  rosterId
}) => {
  const totalBonusWins = weeklyData.filter(week => week.aboveAverage).length;
  const totalWeeks = weeklyData.length;
  const bonusWinPct = totalWeeks > 0 ? (totalBonusWins / totalWeeks * 100) : 0;

  return (
    <div className="space-y-2">
      {/* Clickable indicators row */}
      <div 
        className="flex items-center justify-between cursor-pointer touch-manipulation"
        onClick={onToggle}
      >
        <div className="flex gap-1 flex-wrap">
          {weeklyData.map(week => {
            const weekAverage = weeklyAverages[week.week];
            const isExceptional = week.points > weekAverage * 1.2;
            
            return (
              <div 
                key={week.week}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  week.aboveAverage 
                    ? isExceptional
                      ? 'bg-green-400 ring-2 ring-yellow-400 ring-opacity-60' 
                      : 'bg-green-400'
                    : 'bg-muted-foreground/40'
                }`} 
              />
            );
          })}
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`} 
        />
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="bg-card/50 border border-border/50 rounded-lg p-3 space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          {/* Summary */}
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-card-foreground">Weekly Performance</span>
            <span className="text-muted-foreground">
              {totalBonusWins}/{totalWeeks} weeks above avg ({bonusWinPct.toFixed(0)}%)
            </span>
          </div>

          {/* Weekly breakdown */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {weeklyData.map(week => {
              const weekAverage = weeklyAverages[week.week];
              const isExceptional = week.points > weekAverage * 1.2;
              
              return (
                <div 
                  key={week.week}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded bg-background/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-card-foreground min-w-[3rem]">
                      Week {week.week}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                      week.aboveAverage 
                        ? isExceptional
                          ? 'bg-green-400 ring-1 ring-yellow-400' 
                          : 'bg-green-400'
                        : 'bg-muted-foreground/40'
                    }`} />
                  </div>
                  
                  <div className="flex items-center gap-3 text-right">
                    <div className="space-y-0.5">
                      <div className="font-medium">{week.points.toFixed(1)} pts</div>
                      <div className="text-muted-foreground">
                        Avg: {weekAverage?.toFixed(1)}
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-1 min-w-[4rem] ${
                      week.aboveAverage ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {week.aboveAverage ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span className="font-medium">
                        {week.aboveAverage ? '+' : ''}
                        {week.difference.toFixed(1)}
                      </span>
                    </div>
                    
                    {isExceptional && (
                      <span className="text-yellow-400">🔥</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};