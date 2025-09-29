import React, { memo } from 'react';
import { AnalyticsAccordion } from './analytics/AnalyticsAccordion';
import { AnalyticsView } from './analytics/AnalyticsView';
import TeamEfficiencyChart from './analytics/TeamEfficiencyChart';
import TransactionActivityChart from './analytics/TransactionActivityChart';
import PositionValueChart from './analytics/PositionValueChart';
import PlayerAcquisitionChart from './analytics/PlayerAcquisitionChart';
import TeamPerformanceChart from './analytics/TeamPerformanceChart';
import LeagueMetricsCards from './analytics/LeagueMetricsCards';
import SalaryDistributionChart from './analytics/SalaryDistributionChart';

// Memoized analytics components for better performance
export const MemoizedAnalyticsAccordion = memo(AnalyticsAccordion);
export const MemoizedAnalyticsView = memo(AnalyticsView);
export const MemoizedTeamEfficiencyChart = memo(TeamEfficiencyChart);
export const MemoizedTransactionActivityChart = memo(TransactionActivityChart);
export const MemoizedPositionValueChart = memo(PositionValueChart);
export const MemoizedPlayerAcquisitionChart = memo(PlayerAcquisitionChart);
export const MemoizedTeamPerformanceChart = memo(TeamPerformanceChart);
export const MemoizedLeagueMetricsCards = memo(LeagueMetricsCards);
export const MemoizedSalaryDistributionChart = memo(SalaryDistributionChart);

// Custom hook for progressive data loading
export const useProgressiveDataLoading = () => {
  const [loadingStage, setLoadingStage] = React.useState<'league' | 'rosters' | 'analytics' | 'complete'>('league');
  
  React.useEffect(() => {
    // Simulate progressive loading stages
    const stages = ['league', 'rosters', 'analytics', 'complete'] as const;
    let currentIndex = 0;
    
    const progressLoader = setInterval(() => {
      if (currentIndex < stages.length - 1) {
        currentIndex++;
        setLoadingStage(stages[currentIndex]);
      } else {
        clearInterval(progressLoader);
      }
    }, 200); // Load next stage every 200ms
    
    return () => clearInterval(progressLoader);
  }, []);
  
  return { loadingStage };
};

// Virtual scrolling wrapper for large lists
interface VirtualScrollProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
}

export const VirtualScroll: React.FC<VirtualScrollProps> = memo(({ 
  items, 
  renderItem, 
  itemHeight = 50,
  containerHeight = 400 
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(visibleStart + Math.ceil(containerHeight / itemHeight), items.length);
  
  const visibleItems = items.slice(visibleStart, visibleEnd);
  
  return (
    <div 
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${visibleStart * itemHeight}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={visibleStart + index} style={{ height: itemHeight }}>
              {renderItem(item, visibleStart + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualScroll.displayName = 'VirtualScroll';