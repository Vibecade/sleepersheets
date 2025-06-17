import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AchievementBadgeProps {
  name: string;
  icon: React.ReactNode;
  description: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  className?: string;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  name,
  icon,
  description,
  unlocked,
  progress = 0,
  maxProgress = 1,
  className
}) => {
  const progressPercentage = Math.min(100, Math.max(0, (progress / maxProgress) * 100));
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "relative flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-300",
              unlocked 
                ? "bg-gradient-to-br from-yellow-400 to-amber-600 shadow-lg shadow-amber-500/20" 
                : "bg-gray-800 opacity-60",
              className
            )}
          >
            <div className={cn(
              "absolute inset-0.5 rounded-full flex items-center justify-center",
              unlocked ? "bg-gradient-to-br from-amber-300 to-yellow-500" : "bg-gray-700"
            )}>
              <div className={cn(
                "text-2xl",
                unlocked ? "text-white" : "text-gray-400"
              )}>
                {icon}
              </div>
            </div>
            
            {/* Progress ring */}
            {!unlocked && maxProgress > 1 && (
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="47%"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-gray-600"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="47%"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="100"
                  strokeDashoffset={100 - progressPercentage}
                  className="text-blue-400 transition-all duration-500"
                />
              </svg>
            )}
            
            {unlocked && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{name}</p>
            <p className="text-xs text-gray-300">{description}</p>
            {!unlocked && maxProgress > 1 && (
              <p className="text-xs text-blue-400">Progress: {progress}/{maxProgress}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AchievementBadge;