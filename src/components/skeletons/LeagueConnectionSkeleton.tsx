
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const LeagueConnectionSkeleton = () => {
  return (
    <Card className="border-yellow-500/20 shadow-[0_0_50px_-12px] shadow-yellow-500/30">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-4 w-64 mx-auto" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        
        <div className="relative py-4">
          <Skeleton className="h-px w-full" />
          <div className="absolute inset-0 flex justify-center">
            <Skeleton className="h-4 w-8 bg-background" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeagueConnectionSkeleton;
