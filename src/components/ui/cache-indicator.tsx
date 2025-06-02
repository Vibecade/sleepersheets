
import { cn } from "@/lib/utils";
import { Clock, Zap, Wifi, WifiOff } from "lucide-react";

interface CacheIndicatorProps {
  isCached: boolean;
  lastFetched?: Date;
  className?: string;
}

const CacheIndicator: React.FC<CacheIndicatorProps> = ({
  isCached,
  lastFetched,
  className
}) => {
  const formatLastFetched = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className={cn("flex items-center space-x-1 text-xs", className)}>
      {isCached ? (
        <>
          <Zap className="w-3 h-3 text-green-500" />
          <span className="text-green-400">Cached</span>
        </>
      ) : (
        <>
          <Wifi className="w-3 h-3 text-blue-500" />
          <span className="text-blue-400">Fresh</span>
        </>
      )}
      {lastFetched && (
        <>
          <Clock className="w-3 h-3 text-gray-500" />
          <span className="text-gray-400">{formatLastFetched(lastFetched)}</span>
        </>
      )}
    </div>
  );
};

export { CacheIndicator };
