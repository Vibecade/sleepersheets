import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileWeeklyPerformance } from './MobileWeeklyPerformance';

export interface WeeklyPerformance {
  week: number;
  points: number;
  aboveAverage: boolean;
  difference: number;
}

interface WeeklyPerformanceIndicatorsProps {
  weeklyData: WeeklyPerformance[];
  weeklyAverages: Record<number, number>;
  rosterId?: number;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const WeeklyPerformanceIndicators: React.FC<WeeklyPerformanceIndicatorsProps> = ({
  weeklyData,
  weeklyAverages,
  rosterId,
  isExpanded = false,
  onToggle,
}) => {
  const isMobile = useIsMobile();

  // Mobile: Use expandable interface
  if (isMobile && rosterId && onToggle) {
    return (
      <MobileWeeklyPerformance
        weeklyData={weeklyData}
        weeklyAverages={weeklyAverages}
        isExpanded={isExpanded}
        onToggle={onToggle}
        rosterId={rosterId}
      />
    );
  }

  // Desktop: Keep existing tooltip behavior
  return (
    <div className="flex gap-1 mt-2 flex-wrap">
      {weeklyData.map(week => {
        const weekAverage = weeklyAverages[week.week];
        const isExceptional = week.points > weekAverage * 1.2;
        
        return (
          <TooltipProvider key={week.week}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className={`w-3 h-3 rounded-full cursor-help transition-all duration-200 hover:scale-125 ${
                    week.aboveAverage 
                      ? isExceptional
                        ? 'bg-green-400 ring-2 ring-yellow-400 ring-opacity-60' 
                        : 'bg-green-400'
                      : 'bg-muted-foreground/40'
                  }`} 
                />
              </TooltipTrigger>
              <TooltipContent 
                className="bg-card border border-border text-card-foreground max-w-48 z-[60]"
                collisionPadding={8}
                sideOffset={5}
              >
                <div className="text-xs space-y-1">
                  <div className="font-medium">Week {week.week}</div>
                  <div>Team: {week.points.toFixed(2)} pts</div>
                  <div>League Avg: {weekAverage?.toFixed(2)} pts</div>
                  <div className={`font-medium ${
                    week.aboveAverage ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {week.aboveAverage ? '+' : ''}
                    {week.difference.toFixed(2)} pts
                    {week.aboveAverage ? ' ✓' : ''}
                  </div>
                  {isExceptional && (
                    <div className="text-yellow-400 text-xs font-medium">
                      🔥 Exceptional week!
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};