
import { Skeleton } from '@/components/ui/skeleton';

const PageNavigationSkeleton = () => {
  return (
    <div className="glass-card rounded-xl p-2 mb-6">
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  );
};

export default PageNavigationSkeleton;
