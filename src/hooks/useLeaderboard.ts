import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardUser {
  id: string;
  displayName: string;
  avatarUrl?: string;
  level: number;
  points: number;
  achievements: number;
  isCurrentUser: boolean;
}

export const useLeaderboard = (leagueId: string) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!leagueId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        // Get all users who have joined this league
        const { data: leagueUsers, error: leagueError } = await supabase
          .from('user_achievement_profiles')
          .select('user_id, level, points')
          .contains('leagues_joined', [leagueId])
          .order('points', { ascending: false });
          
        if (leagueError) {
          console.error('Error loading league users:', leagueError);
          return;
        }
        
        if (!leagueUsers || leagueUsers.length === 0) {
          setLeaderboard([]);
          setLoading(false);
          return;
        }
        
        // Get achievement counts for each user
        const userIds = leagueUsers.map(u => u.user_id);
        
        const { data: achievementCounts, error: achievementError } = await supabase
          .from('user_achievements')
          .select('user_id, count')
          .eq('unlocked', true)
          .in('user_id', userIds)
          .group('user_id');
          
        if (achievementError) {
          console.error('Error loading achievement counts:', achievementError);
        }
        
        // Get user profiles
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);
          
        if (profileError) {
          console.error('Error loading user profiles:', profileError);
        }
        
        // Combine data
        const leaderboardData = leagueUsers.map((leagueUser, index) => {
          const achievementCount = achievementCounts?.find(a => a.user_id === leagueUser.user_id)?.count || 0;
          const profile = profiles?.find(p => p.id === leagueUser.user_id);
          const isCurrentUser = leagueUser.user_id === user?.id;
          
          if (isCurrentUser) {
            setUserRank(index + 1);
          }
          
          return {
            id: leagueUser.user_id,
            displayName: profile?.full_name || 'Unknown User',
            avatarUrl: profile?.avatar_url,
            level: leagueUser.level,
            points: leagueUser.points,
            achievements: achievementCount,
            isCurrentUser
          };
        });
        
        setLeaderboard(leaderboardData);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadLeaderboard();
  }, [leagueId, user?.id]);
  
  return {
    leaderboard,
    userRank,
    loading
  };
};