import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, ExternalLink, Newspaper, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type NewsCategory = 'all' | 'injury' | 'rookie';

interface PlayerNewsItem {
  id: string;
  title: string;
  link: string;
  summary: string;
  source: string;
  sourceId: string;
  category: 'injury' | 'rookie' | 'general';
  publishedAt: string | null;
}

interface NewsSourceError {
  source: string;
  message: string;
}

interface PlayerNewsResponse {
  items: PlayerNewsItem[];
  fetchedAt: string;
  sources: Array<{ id: string; name: string }>;
  sourceErrors: NewsSourceError[];
}

const NEWS_ENDPOINT = import.meta.env.VITE_PLAYER_NEWS_ENDPOINT || '/api/player-news';

const CATEGORY_OPTIONS: Array<{ id: NewsCategory; label: string }> = [
  { id: 'all', label: 'All News' },
  { id: 'injury', label: 'Injuries' },
  { id: 'rookie', label: 'Rookies' },
];

const categoryLabel = (category: PlayerNewsItem['category']) => {
  if (category === 'injury') return 'Injury';
  if (category === 'rookie') return 'Rookie';
  return 'General';
};

const fetchPlayerNews = async (): Promise<PlayerNewsResponse> => {
  const response = await fetch(`${NEWS_ENDPOINT}?limit=45`);
  if (!response.ok) {
    throw new Error(`News feed request failed (${response.status})`);
  }
  return response.json();
};

const PlayerNewsFeed: React.FC = () => {
  const [category, setCategory] = useState<NewsCategory>('all');

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['player-news-feed'],
    queryFn: fetchPlayerNews,
    staleTime: 5 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const filteredItems = useMemo(() => {
    const items = data?.items || [];
    if (category === 'all') return items;
    return items.filter((item) => item.category === category);
  }, [data?.items, category]);

  return (
    <Card className="transition-all duration-150 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Player News Feed</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((option) => (
            <Button
              key={option.id}
              size="sm"
              variant={category === option.id ? 'default' : 'outline'}
              onClick={() => setCategory(option.id)}
              className="h-8"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-border/60 p-3 space-y-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-destructive" />
              <div className="space-y-2">
                <p className="text-sm font-medium">News feed is temporarily unavailable.</p>
                <p className="text-xs text-muted-foreground">
                  {error instanceof Error ? error.message : 'Unable to load player news right now.'}
                </p>
                <Button size="sm" onClick={() => void refetch()}>
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !isError && filteredItems.length === 0 && (
          <div className="rounded-lg border border-border/60 p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              No {category === 'all' ? 'news' : category} updates found right now.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => void refetch()}>
                Refresh Feed
              </Button>
              {category !== 'all' && (
                <Button size="sm" variant="outline" onClick={() => setCategory('all')}>
                  Show All News
                </Button>
              )}
            </div>
          </div>
        )}

        {!isLoading && !isError && filteredItems.length > 0 && (
          <div className="space-y-3">
            {filteredItems.slice(0, 18).map((item) => (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-border/60 p-3 transition-all duration-150 hover:bg-card/40 hover:border-border"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[11px]">
                      {item.source}
                    </Badge>
                    <Badge variant="secondary" className="text-[11px]">
                      {categoryLabel(item.category)}
                    </Badge>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </div>

                <p className="text-sm font-medium leading-snug">{item.title}</p>
                {item.summary && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.summary}</p>
                )}
                <p className="text-[11px] text-muted-foreground mt-2">
                  {item.publishedAt
                    ? `${formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true })}`
                    : 'Recently published'}
                </p>
              </a>
            ))}

            {data?.sourceErrors && data.sourceErrors.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Some sources were unavailable: {data.sourceErrors.map((entry) => entry.source).join(', ')}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerNewsFeed;
