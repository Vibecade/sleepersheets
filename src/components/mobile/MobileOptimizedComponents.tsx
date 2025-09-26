import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TouchInput } from '@/components/ui/touch-input';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calculator,
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react';

interface MobileTeamCardProps {
  teamName: string;
  userName: string;
  salary: number;
  salaryCap: number;
  faabRemaining: number;
  playerCount: number;
  className?: string;
  onQuickAction?: (action: string) => void;
}

export function MobileTeamCard({
  teamName,
  userName,
  salary,
  salaryCap,
  faabRemaining,
  playerCount,
  className,
  onQuickAction
}: MobileTeamCardProps) {
  const isMobile = useIsMobile();
  
  if (!isMobile) return null;

  const salaryPercentage = (salary / salaryCap) * 100;
  const isOverCap = salary > salaryCap;

  return (
    <Card className={cn("touch-manipulation", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{teamName}</CardTitle>
            <p className="text-sm text-muted-foreground">{userName}</p>
          </div>
          <Badge variant={isOverCap ? "destructive" : "secondary"}>
            {playerCount} players
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Salary Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Salary Cap</span>
            <span className={isOverCap ? "text-destructive font-medium" : ""}>
              ${salary.toLocaleString()} / ${salaryCap.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all",
                isOverCap ? "bg-destructive" : "bg-primary"
              )}
              style={{ width: `${Math.min(salaryPercentage, 100)}%` }}
            />
          </div>
          {isOverCap && (
            <p className="text-xs text-destructive">
              Over cap by ${(salary - salaryCap).toLocaleString()}
            </p>
          )}
        </div>

        {/* FAAB Remaining */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">FAAB Remaining</span>
          </div>
          <span className="text-lg font-bold text-green-600">
            ${faabRemaining}
          </span>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickAction?.('manage-faab')}
            className="h-12 flex flex-col items-center space-y-1"
          >
            <Calculator className="h-4 w-4" />
            <span className="text-xs">Manage FAAB</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickAction?.('view-details')}
            className="h-12 flex flex-col items-center space-y-1"
          >
            <Users className="h-4 w-4" />
            <span className="text-xs">View Details</span>
            <ChevronRight className="h-3 w-3 opacity-50" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface MobileFAABInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
}

export function MobileFAABInput({
  value,
  onChange,
  min = 0,
  max = 1000,
  step = 1,
  label,
  className
}: MobileFAABInputProps) {
  const isMobile = useIsMobile();

  const increment = () => {
    const newValue = Math.min(value + step, max);
    onChange(newValue);
  };

  const decrement = () => {
    const newValue = Math.max(value - step, min);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0;
    onChange(Math.min(Math.max(newValue, min), max));
  };

  if (!isMobile) {
    return (
      <div className={className}>
        {label && <label className="text-sm font-medium mb-2 block">{label}</label>}
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <label className="text-sm font-medium mb-2 block">{label}</label>
      )}
      <TouchInput
        type="number"
        value={value}
        onChange={handleInputChange}
        onIncrement={increment}
        onDecrement={decrement}
        showControls={true}
        step={step}
        min={min}
        max={max}
        className="text-center text-lg font-semibold"
      />
    </div>
  );
}

interface MobilePlayerRowProps {
  playerName: string;
  position: string;
  salary: number;
  contractLength?: number;
  onSwipeAction?: (action: 'edit' | 'delete') => void;
  className?: string;
}

export function MobilePlayerRow({
  playerName,
  position,
  salary,
  contractLength,
  onSwipeAction,
  className
}: MobilePlayerRowProps) {
  const isMobile = useIsMobile();
  
  if (!isMobile) return null;

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 border rounded-lg",
        "touch-manipulation active:bg-muted/50 transition-colors",
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="font-medium truncate">{playerName}</h3>
          <Badge variant="outline" className="text-xs">
            {position}
          </Badge>
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>${salary.toLocaleString()}</span>
          {contractLength && (
            <span>{contractLength} years</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2 ml-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSwipeAction?.('edit')}
          className="h-8 w-8 p-0"
        >
          <Calculator className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSwipeAction?.('delete')}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface MobileStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function MobileStatsCard({
  title,
  value,
  subtitle,
  trend = 'neutral',
  icon: Icon,
  className
}: MobileStatsCardProps) {
  const isMobile = useIsMobile();
  
  if (!isMobile) return null;

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-muted-foreground'
  };

  return (
    <Card className={cn("touch-manipulation", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className={cn("text-xs", trendColors[trend])}>
                {trend === 'up' && <TrendingUp className="inline h-3 w-3 mr-1" />}
                {subtitle}
              </p>
            )}
          </div>
          {Icon && (
            <div className="ml-4">
              <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}