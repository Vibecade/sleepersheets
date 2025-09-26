import { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  disabled?: boolean;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 100,
  disabled = false
}: PullToRefreshOptions) => {
  const isMobile = useIsMobile();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || !isMobile || window.scrollY > 0) return;
    
    const touch = e.touches[0];
    setStartY(touch.clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || disabled || !isMobile || window.scrollY > 0) return;
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    const deltaY = currentY - startY;
    
    if (deltaY > 0) {
      e.preventDefault();
      const distance = Math.min(deltaY * 0.5, threshold * 1.5);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (!isDragging || disabled) return;
    
    setIsDragging(false);
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  };

  useEffect(() => {
    if (!isMobile || disabled) return;

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, disabled, isDragging, startY, pullDistance, threshold, isRefreshing]);

  const refreshIndicatorStyle = {
    transform: `translateY(${pullDistance}px)`,
    opacity: pullDistance > 0 ? Math.min(pullDistance / threshold, 1) : 0,
    transition: isDragging ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out'
  };

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    refreshIndicatorStyle,
    canRefresh: pullDistance >= threshold
  };
};