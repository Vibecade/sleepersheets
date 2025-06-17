import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: 'salary' | 'contract' | 'league' | 'trade' | 'special';
  points: number;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  canClaim: boolean;
  dateUnlocked?: string;
}

export const useAchievements = (leagueId: string) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userLevel, setUserLevel] = useState(1);
  const [userPoints, setUserPoints] = useState(0);
  const [nextLevelPoints, setNextLevelPoints] = useState(100);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<{points: number, message: string, type: 'achievement' | 'level' | 'points'}[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Calculate total and unlocked achievements
  const totalAchievements = achievements.length;
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;

  // Load achievements from database or initialize defaults
  useEffect(() => {
    const loadAchievements = async () => {
      if (!leagueId || !user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        // First, check if user has a profile in the achievements system
        const { data: profile, error: profileError } = await supabase
          .from('user_achievement_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGSQL_ERROR_NO_DATA_FOUND') {
          console.error('Error loading achievement profile:', profileError);
        }
        
        // If no profile exists, create one
        if (!profile) {
          const { error: createError } = await supabase
            .from('user_achievement_profiles')
            .insert({
              user_id: user.id,
              level: 1,
              points: 0,
              leagues_joined: [leagueId]
            });
            
          if (createError) {
            console.error('Error creating achievement profile:', createError);
          }
          
          setUserLevel(1);
          setUserPoints(0);
        } else {
          setUserLevel(profile.level);
          setUserPoints(profile.points);
          
          // Add this league to leagues_joined if not already there
          if (!profile.leagues_joined.includes(leagueId)) {
            const { error: updateError } = await supabase
              .from('user_achievement_profiles')
              .update({
                leagues_joined: [...profile.leagues_joined, leagueId]
              })
              .eq('user_id', user.id);
              
            if (updateError) {
              console.error('Error updating leagues joined:', updateError);
            }
          }
        }
        
        // Load user's achievements
        const { data: userAchievements, error: achievementsError } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', user.id);
          
        if (achievementsError) {
          console.error('Error loading user achievements:', achievementsError);
        }
        
        // Generate default achievements list
        const defaultAchievements = generateDefaultAchievements();
        
        // Merge with user's unlocked achievements
        const mergedAchievements = defaultAchievements.map(achievement => {
          const userAchievement = userAchievements?.find(ua => ua.achievement_id === achievement.id);
          
          if (userAchievement) {
            return {
              ...achievement,
              unlocked: userAchievement.unlocked,
              progress: userAchievement.progress,
              dateUnlocked: userAchievement.unlocked_at,
              canClaim: userAchievement.progress >= achievement.maxProgress && !userAchievement.unlocked
            };
          }
          
          return achievement;
        });
        
        setAchievements(mergedAchievements);
        setNextLevelPoints(calculateNextLevelPoints(userLevel));
      } catch (error) {
        console.error('Error in useAchievements:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAchievements();
  }, [leagueId, user]);
  
  // Calculate points needed for next level
  const calculateNextLevelPoints = (level: number): number => {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  };
  
  // Generate default achievements
  const generateDefaultAchievements = (): Achievement[] => {
    return [
      {
        id: 'salary_manager_1',
        name: 'Salary Manager I',
        description: 'Set salaries for 10 players',
        type: 'salary',
        points: 50,
        unlocked: false,
        progress: 0,
        maxProgress: 10,
        canClaim: false
      },
      {
        id: 'salary_manager_2',
        name: 'Salary Manager II',
        description: 'Set salaries for 50 players',
        type: 'salary',
        points: 100,
        unlocked: false,
        progress: 0,
        maxProgress: 50,
        canClaim: false
      },
      {
        id: 'contract_master_1',
        name: 'Contract Master I',
        description: 'Set contract lengths for 10 players',
        type: 'contract',
        points: 50,
        unlocked: false,
        progress: 0,
        maxProgress: 10,
        canClaim: false
      },
      {
        id: 'contract_master_2',
        name: 'Contract Master II',
        description: 'Set contract lengths for 50 players',
        type: 'contract',
        points: 100,
        unlocked: false,
        progress: 0,
        maxProgress: 50,
        canClaim: false
      },
      {
        id: 'league_owner',
        name: 'League Owner',
        description: 'Claim ownership of a league',
        type: 'league',
        points: 200,
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        canClaim: false
      },
      {
        id: 'multi_league',
        name: 'Dynasty Mogul',
        description: 'Connect 3 different leagues',
        type: 'league',
        points: 150,
        unlocked: false,
        progress: 0,
        maxProgress: 3,
        canClaim: false
      },
      {
        id: 'trade_simulator',
        name: 'Trade Wizard',
        description: 'Simulate 5 trades',
        type: 'trade',
        points: 75,
        unlocked: false,
        progress: 0,
        maxProgress: 5,
        canClaim: false
      },
      {
        id: 'dead_cap_manager',
        name: 'Cap Space Guru',
        description: 'Add 3 players to dead cap',
        type: 'salary',
        points: 100,
        unlocked: false,
        progress: 0,
        maxProgress: 3,
        canClaim: false
      },
      {
        id: 'data_exporter',
        name: 'Data Analyst',
        description: 'Export league data',
        type: 'special',
        points: 50,
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        canClaim: false
      },
      {
        id: 'perfect_cap',
        name: 'Cap Perfection',
        description: 'Have all teams under the salary cap',
        type: 'salary',
        points: 150,
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        canClaim: false
      }
    ];
  };
  
  // Update achievement progress
  const updateAchievementProgress = useCallback(async (achievementId: string, progress: number) => {
    if (!user) return;
    
    try {
      const achievement = achievements.find(a => a.id === achievementId);
      if (!achievement) return;
      
      // Check if this achievement already exists for the user
      const { data: existingAchievement, error: checkError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .eq('achievement_id', achievementId)
        .single();
        
      if (checkError && checkError.code !== 'PGSQL_ERROR_NO_DATA_FOUND') {
        console.error('Error checking achievement:', checkError);
        return;
      }
      
      const newProgress = Math.min(achievement.maxProgress, progress);
      const canClaim = newProgress >= achievement.maxProgress && !achievement.unlocked;
      
      if (existingAchievement) {
        // Update existing achievement
        const { error: updateError } = await supabase
          .from('user_achievements')
          .update({
            progress: newProgress,
          })
          .eq('user_id', user.id)
          .eq('achievement_id', achievementId);
          
        if (updateError) {
          console.error('Error updating achievement progress:', updateError);
          return;
        }
      } else {
        // Create new achievement record
        const { error: insertError } = await supabase
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_id: achievementId,
            progress: newProgress,
            unlocked: false
          });
          
        if (insertError) {
          console.error('Error creating achievement record:', insertError);
          return;
        }
      }
      
      // Update local state
      setAchievements(prev => prev.map(a => 
        a.id === achievementId 
          ? { ...a, progress: newProgress, canClaim } 
          : a
      ));
      
      // Show notification if achievement can be claimed
      if (canClaim) {
        toast({
          title: "Achievement Ready!",
          description: `You can now claim "${achievement.name}"`,
        });
      }
    } catch (error) {
      console.error('Error updating achievement progress:', error);
    }
  }, [user, achievements, toast]);
  
  // Claim an achievement
  const claimAchievement = useCallback(async (achievementId: string) => {
    if (!user) return;
    
    try {
      const achievement = achievements.find(a => a.id === achievementId);
      if (!achievement || !achievement.canClaim) return;
      
      // Update achievement to unlocked
      const { error: updateError } = await supabase
        .from('user_achievements')
        .update({
          unlocked: true,
          unlocked_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('achievement_id', achievementId);
        
      if (updateError) {
        console.error('Error claiming achievement:', updateError);
        return;
      }
      
      // Add points to user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_achievement_profiles')
        .select('points, level')
        .eq('user_id', user.id)
        .single();
        
      if (profileError) {
        console.error('Error loading user profile:', profileError);
        return;
      }
      
      const newPoints = profile.points + achievement.points;
      let newLevel = profile.level;
      let leveledUp = false;
      
      // Check if user leveled up
      while (newPoints >= calculateNextLevelPoints(newLevel)) {
        newLevel++;
        leveledUp = true;
      }
      
      // Update user profile
      const { error: updateProfileError } = await supabase
        .from('user_achievement_profiles')
        .update({
          points: newPoints,
          level: newLevel
        })
        .eq('user_id', user.id);
        
      if (updateProfileError) {
        console.error('Error updating user profile:', updateProfileError);
        return;
      }
      
      // Update local state
      setAchievements(prev => prev.map(a => 
        a.id === achievementId 
          ? { ...a, unlocked: true, canClaim: false, dateUnlocked: new Date().toISOString() } 
          : a
      ));
      setUserPoints(newPoints);
      
      if (leveledUp) {
        setUserLevel(newLevel);
        setNextLevelPoints(calculateNextLevelPoints(newLevel));
        
        // Add level up notification
        setNotifications(prev => [...prev, {
          points: 0,
          message: `Leveled up to Level ${newLevel}!`,
          type: 'level'
        }]);
        
        toast({
          title: "Level Up!",
          description: `You've reached Level ${newLevel}!`,
          variant: "default"
        });
      }
      
      // Add achievement notification
      setNotifications(prev => [...prev, {
        points: achievement.points,
        message: `Achievement Unlocked: ${achievement.name}`,
        type: 'achievement'
      }]);
      
    } catch (error) {
      console.error('Error claiming achievement:', error);
    }
  }, [user, achievements, calculateNextLevelPoints, toast]);
  
  // Track salary updates
  const trackSalaryUpdate = useCallback(() => {
    updateAchievementProgress('salary_manager_1', achievements.find(a => a.id === 'salary_manager_1')?.progress + 1 || 1);
    updateAchievementProgress('salary_manager_2', achievements.find(a => a.id === 'salary_manager_2')?.progress + 1 || 1);
  }, [achievements, updateAchievementProgress]);
  
  // Track contract updates
  const trackContractUpdate = useCallback(() => {
    updateAchievementProgress('contract_master_1', achievements.find(a => a.id === 'contract_master_1')?.progress + 1 || 1);
    updateAchievementProgress('contract_master_2', achievements.find(a => a.id === 'contract_master_2')?.progress + 1 || 1);
  }, [achievements, updateAchievementProgress]);
  
  // Track league ownership
  const trackLeagueOwnership = useCallback(() => {
    updateAchievementProgress('league_owner', 1);
  }, [updateAchievementProgress]);
  
  // Track league connections
  const trackLeagueConnection = useCallback((leagueCount: number) => {
    updateAchievementProgress('multi_league', leagueCount);
  }, [updateAchievementProgress]);
  
  // Track trade simulations
  const trackTradeSimulation = useCallback(() => {
    updateAchievementProgress('trade_simulator', achievements.find(a => a.id === 'trade_simulator')?.progress + 1 || 1);
  }, [achievements, updateAchievementProgress]);
  
  // Track dead cap additions
  const trackDeadCapAddition = useCallback(() => {
    updateAchievementProgress('dead_cap_manager', achievements.find(a => a.id === 'dead_cap_manager')?.progress + 1 || 1);
  }, [achievements, updateAchievementProgress]);
  
  // Track data exports
  const trackDataExport = useCallback(() => {
    updateAchievementProgress('data_exporter', 1);
  }, [updateAchievementProgress]);
  
  // Track perfect cap management
  const trackPerfectCapManagement = useCallback((allTeamsUnderCap: boolean) => {
    if (allTeamsUnderCap) {
      updateAchievementProgress('perfect_cap', 1);
    }
  }, [updateAchievementProgress]);
  
  // Award points directly (for actions without achievements)
  const awardPoints = useCallback(async (points: number, reason: string) => {
    if (!user) return;
    
    try {
      // Add points to user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_achievement_profiles')
        .select('points, level')
        .eq('user_id', user.id)
        .single();
        
      if (profileError) {
        console.error('Error loading user profile:', profileError);
        return;
      }
      
      const newPoints = profile.points + points;
      let newLevel = profile.level;
      let leveledUp = false;
      
      // Check if user leveled up
      while (newPoints >= calculateNextLevelPoints(newLevel)) {
        newLevel++;
        leveledUp = true;
      }
      
      // Update user profile
      const { error: updateProfileError } = await supabase
        .from('user_achievement_profiles')
        .update({
          points: newPoints,
          level: newLevel
        })
        .eq('user_id', user.id);
        
      if (updateProfileError) {
        console.error('Error updating user profile:', updateProfileError);
        return;
      }
      
      // Update local state
      setUserPoints(newPoints);
      
      if (leveledUp) {
        setUserLevel(newLevel);
        setNextLevelPoints(calculateNextLevelPoints(newLevel));
        
        // Add level up notification
        setNotifications(prev => [...prev, {
          points: 0,
          message: `Leveled up to Level ${newLevel}!`,
          type: 'level'
        }]);
      }
      
      // Add points notification
      setNotifications(prev => [...prev, {
        points,
        message: reason,
        type: 'points'
      }]);
      
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  }, [user, calculateNextLevelPoints]);
  
  // Remove a notification after it's displayed
  const removeNotification = useCallback(() => {
    setNotifications(prev => prev.slice(1));
  }, []);

  return {
    achievements,
    userLevel,
    userPoints,
    nextLevelPoints,
    totalAchievements,
    unlockedAchievements,
    loading,
    notifications,
    claimAchievement,
    trackSalaryUpdate,
    trackContractUpdate,
    trackLeagueOwnership,
    trackLeagueConnection,
    trackTradeSimulation,
    trackDeadCapAddition,
    trackDataExport,
    trackPerfectCapManagement,
    awardPoints,
    removeNotification
  };
};