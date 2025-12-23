import { useEffect, useRef, useState, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  disabled?: boolean;
}

function triggerHaptic(intensity: 'light' | 'medium' = 'light') {
  if ('vibrate' in navigator) {
    navigator.vibrate(intensity === 'light' ? 10 : 20);
  }
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  disabled = false
}: PullToRefreshOptions) => {
  const isMobile = useIsMobile();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const hasTriggeredHapticRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || !isMobile || isRefreshing) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 5) return;

    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    isDraggingRef.current = true;
    hasTriggeredHapticRef.current = false;
  }, [disabled, isMobile, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDraggingRef.current || disabled || !isMobile || isRefreshing) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 5) {
      isDraggingRef.current = false;
      setPullDistance(0);
      return;
    }

    const touch = e.touches[0];
    const currentY = touch.clientY;
    const deltaY = currentY - startYRef.current;

    if (deltaY > 0) {
      e.preventDefault();
      const resistance = 0.4;
      const distance = Math.min(deltaY * resistance, threshold * 1.5);
      setPullDistance(distance);

      if (distance >= threshold && !hasTriggeredHapticRef.current) {
        triggerHaptic('medium');
        hasTriggeredHapticRef.current = true;
      }
    }
  }, [disabled, isMobile, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isDraggingRef.current || disabled || isRefreshing) return;

    isDraggingRef.current = false;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      triggerHaptic('medium');

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  }, [disabled, isRefreshing, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    if (!isMobile || disabled) return;

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, disabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);
  const isReady = pullDistance >= threshold;

  const refreshIndicatorStyle = {
    transform: `translateY(${pullDistance}px) rotate(${progress * 180}deg)`,
    opacity: pullDistance > 10 ? Math.min(progress + 0.3, 1) : 0,
    transition: isDraggingRef.current ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    scale: isReady ? 1.1 : 1,
  };

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    progress,
    refreshIndicatorStyle,
    canRefresh: isReady,
    isReady
  };
};