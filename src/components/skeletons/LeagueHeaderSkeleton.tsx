
import { Skeleton } from '@/components/ui/skeleton';

const LeagueHeaderSkeleton = () => {
  return (
    <div className="glass-card rounded-xl p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
    </div>
  );
};

export default LeagueHeaderSkeleton;
