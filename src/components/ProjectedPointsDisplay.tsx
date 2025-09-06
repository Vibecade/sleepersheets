import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ProjectionData } from '@/hooks/useHistoricalProjections';

interface ProjectedPointsDisplayProps {
  projection: ProjectionData | undefined;
  actualPoints?: number;
  showActual?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export const ProjectedPointsDisplay: React.FC<ProjectedPointsDisplayProps> = ({
  projection,
  actualPoints,
  showActual = false,
  size = 'default'
}) => {
  if (!projection) {
    return (
      <div className="text-muted-foreground text-sm">
        No projection
      </div>
    );
  }

  const { projectedPoints, confidence, trendAdjustment, gameStatus } = projection;
  
  // Determine confidence color
  const getConfidenceColor = (conf: number, gameStatus?: string) => {
    // Special styling for game status
    if (gameStatus === 'not-played') {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
    if (gameStatus === 'in-progress') {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    }
    
    // Standard confidence colors
    if (conf >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (conf >= 0.6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  // Determine trend icon
  const getTrendIcon = () => {
    if (Math.abs(trendAdjustment) < 0.5) return <Minus className="h-3 w-3" />;
    return trendAdjustment > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (Math.abs(trendAdjustment) < 0.5) return 'text-muted-foreground';
    return trendAdjustment > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const sizeClasses = {
    sm: 'text-xs',
    default: 'text-sm',
    lg: 'text-base'
  };

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${sizeClasses[size]}`}>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Proj:</span>
          <span className="font-medium">{projectedPoints}</span>
          <span className={getTrendColor()}>
            {getTrendIcon()}
          </span>
        </div>
        
        <Tooltip>
          <TooltipTrigger>
            <Badge 
              variant="outline" 
              className={`text-xs px-1 py-0 ${getConfidenceColor(confidence, gameStatus)}`}
            >
              {gameStatus === 'not-played' ? 'Pending' : 
               gameStatus === 'in-progress' ? 'Live' : 
               `${Math.round(confidence * 100)}%`}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1 text-xs">
              <div><strong>Projection Type:</strong> {projection.projectionType === 'draft-based' ? 'Draft-Based' : 'Historical'}</div>
              {gameStatus && (
                <div><strong>Game Status:</strong> {
                  gameStatus === 'not-played' ? 'Games not yet played' :
                  gameStatus === 'in-progress' ? 'Games in progress' :
                  gameStatus === 'poor-performance' ? 'Poor performance this week' :
                  'Games completed'
                }</div>
              )}
              <div><strong>Confidence:</strong> {Math.round(confidence * 100)}%</div>
              {projection.projectionType === 'historical' ? (
                <>
                  <div>Historical Avg: {projection.historicalAverage}</div>
                  <div>Trend Adjustment: {trendAdjustment > 0 ? '+' : ''}{projection.trendAdjustment}</div>
                  <div>Opponent Adjustment: {projection.opponentAdjustment > 0 ? '+' : ''}{projection.opponentAdjustment}</div>
                </>
              ) : (
                <div>Based on draft position & player baselines</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {showActual && actualPoints !== undefined && (
          <div className="text-muted-foreground">
            (Actual: {actualPoints})
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};