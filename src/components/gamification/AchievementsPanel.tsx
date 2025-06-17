import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Star, TrendingUp, Zap, DollarSign, Users, Award, Crown } from 'lucide-react';
import AchievementBadge from './AchievementBadge';
import { useAchievements } from '@/hooks/useAchievements';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface AchievementsPanelProps {
  leagueId: string;
}

const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ leagueId }) => {
  const { achievements, userLevel, userPoints, nextLevelPoints, claimAchievement } = useAchievements(leagueId);
  const [activeTab, setActiveTab] = useState('all');
  
  const levelProgress = (userPoints / nextLevelPoints) * 100;
  
  const achievementCategories = {
    all: achievements,
    unlocked: achievements.filter(a => a.unlocked),
    locked: achievements.filter(a => !a.unlocked),
  };
  
  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'salary': return <DollarSign className="h-full w-full p-1" />;
      case 'contract': return <TrendingUp className="h-full w-full p-1" />;
      case 'league': return <Users className="h-full w-full p-1" />;
      case 'trade': return <Zap className="h-full w-full p-1" />;
      case 'special': return <Star className="h-full w-full p-1" />;
      default: return <Trophy className="h-full w-full p-1" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-amber-400 to-yellow-600 rounded-lg p-2">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Achievements & Levels</CardTitle>
              <CardDescription>
                Complete actions to earn points and unlock achievements
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className="text-sm text-gray-400">Level</div>
              <div className="text-2xl font-bold text-amber-400">{userLevel}</div>
            </div>
            <div className="bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full w-12 h-12 flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Level Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress to Level {userLevel + 1}</span>
            <span className="text-amber-400">{userPoints}/{nextLevelPoints} XP</span>
          </div>
          <Progress value={levelProgress} className="h-2" />
        </div>
        
        {/* Achievements Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="text-sm">
              All <Badge variant="outline" className="ml-1">{achievements.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="unlocked" className="text-sm">
              Unlocked <Badge variant="outline" className="ml-1">{achievementCategories.unlocked.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="locked" className="text-sm">
              Locked <Badge variant="outline" className="ml-1">{achievementCategories.locked.length}</Badge>
            </TabsTrigger>
          </TabsList>
          
          {Object.entries(achievementCategories).map(([key, achievements]) => (
            <TabsContent key={key} value={key} className="mt-4">
              {achievements.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No achievements in this category</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="flex flex-col items-center space-y-2">
                      <AchievementBadge
                        name={achievement.name}
                        icon={getAchievementIcon(achievement.type)}
                        description={achievement.description}
                        unlocked={achievement.unlocked}
                        progress={achievement.progress}
                        maxProgress={achievement.maxProgress}
                      />
                      <div className="text-center">
                        <p className="text-xs font-medium truncate max-w-[80px]">{achievement.name}</p>
                        <p className="text-xs text-gray-400">{achievement.points} XP</p>
                      </div>
                      
                      {achievement.canClaim && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs h-7 px-2 mt-1"
                          onClick={() => claimAchievement(achievement.id)}
                        >
                          Claim
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AchievementsPanel;