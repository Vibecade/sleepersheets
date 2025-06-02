
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ProgressIndicatorProps {
  message?: string;
  progress?: number;
  className?: string;
  showPercentage?: boolean;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  message = "Loading...",
  progress,
  className,
  showPercentage = false
}) => {
  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      <div className="flex-1">
        <p className="text-sm text-gray-300">{message}</p>
        {progress !== undefined && (
          <div className="mt-1">
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            {showPercentage && (
              <p className="text-xs text-gray-400 mt-1">{Math.round(progress)}%</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export { ProgressIndicator };
