import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { 
  Activity, 
  ArrowRightLeft, 
  DollarSign, 
  MessageCircle, 
  Megaphone,
  FileText 
} from 'lucide-react';

interface LeagueActivity {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: any;
  user_id: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
    sleeper_username: string | null;
  } | null;
}

interface LeagueActivityFeedProps {
  leagueId: string;
  className?: string;
  limit?: number;
}

const ACTIVITY_ICONS = {
  trade: ArrowRightLeft,
  waiver: DollarSign,
  comment: MessageCircle,
  announcement: Megaphone,
  contract_update: FileText
};

const ACTIVITY_COLORS = {
  trade: 'bg-blue-500',
  waiver: 'bg-green-500',
  comment: 'bg-purple-500',
  announcement: 'bg-orange-500',
  contract_update: 'bg-indigo-500'
};

export function LeagueActivityFeed({ leagueId, className, limit = 10 }: LeagueActivityFeedProps) {
  const [activities, setActivities] = useState<LeagueActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('league_activities')
        .select('*')
        .eq('league_id', leagueId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Fetch profile data separately for activities with user_id
      const activitiesWithProfiles = await Promise.all(
        (data || []).map(async (activity) => {
          if (activity.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url, sleeper_username')
              .eq('id', activity.user_id)
              .single();
            
            return { ...activity, profiles: profile };
          }
          return { ...activity, profiles: null };
        })
      );
      
      setActivities(activitiesWithProfiles);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('league-activities')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'league_activities',
          filter: `league_id=eq.${leagueId}`
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leagueId, limit]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>League Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>League Activity</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No recent activity in this league</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const IconComponent = ACTIVITY_ICONS[activity.activity_type as keyof typeof ACTIVITY_ICONS] || Activity;
              const colorClass = ACTIVITY_COLORS[activity.activity_type as keyof typeof ACTIVITY_COLORS] || 'bg-gray-500';
              const displayName = activity.profiles?.full_name || 
                                 activity.profiles?.sleeper_username || 
                                 'System';

              return (
                <div key={activity.id} className="flex space-x-3">
                  <div className="flex-shrink-0">
                    {activity.user_id ? (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={activity.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className={`h-10 w-10 rounded-full ${colorClass} flex items-center justify-center`}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-foreground">
                        {activity.title}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {activity.activity_type}
                      </Badge>
                    </div>
                    
                    {activity.description && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {activity.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </span>
                      
                      {activity.metadata?.comment_preview && (
                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded max-w-xs truncate">
                          "{activity.metadata.comment_preview}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}