import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  showValues?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  max,
  label,
  showPercentage = false,
  showValues = false,
  variant = 'default',
  size = 'md',
  className
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-success/20 border-success/30';
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/30';
      case 'danger':
        return 'bg-destructive/20 border-destructive/30';
      default:
        return 'bg-primary/20 border-primary/30';
    }
  };

  const getBarClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-gradient-to-r from-success to-success/80';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
      case 'danger':
        return 'bg-gradient-to-r from-destructive to-destructive/80';
      default:
        return 'bg-gradient-to-r from-primary to-primary/80';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-2';
      case 'lg':
        return 'h-3';
      default:
        return 'h-2.5';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {(label || showPercentage || showValues) && (
        <div className="flex items-center justify-between text-sm">
          {label && (
            <span className="text-muted-foreground font-medium">{label}</span>
          )}
          <div className="flex items-center gap-2">
            {showValues && (
              <span className="text-foreground font-mono text-xs">
                {value.toLocaleString()} / {max.toLocaleString()}
              </span>
            )}
            {showPercentage && (
              <span className="text-foreground font-bold text-xs">
                {percentage.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      )}
      
      <div className={cn(
        'relative rounded-full border overflow-hidden',
        getVariantClasses(),
        getSizeClasses()
      )}>
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out rounded-full',
            getBarClasses()
          )}
          style={{ width: `${percentage}%` }}
        />
        {percentage > 80 && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
        )}
      </div>
    </div>
  );
};

export default ProgressIndicator;