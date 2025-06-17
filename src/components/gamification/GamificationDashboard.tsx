import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Crown, Star, TrendingUp, Sparkles } from 'lucide-react';
import AchievementsPanel from './AchievementsPanel';
import LeaderboardPanel from './LeaderboardPanel';
import { useAchievements } from '@/hooks/useAchievements';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface GamificationDashboardProps {
  leagueId: string;
}

const GamificationDashboard: React.FC<GamificationDashboardProps> = ({ leagueId }) => {
  const [activeTab, setActiveTab] = useState('achievements');
  const { userLevel, userPoints, nextLevelPoints, totalAchievements, unlockedAchievements } = useAchievements(leagueId);
  const { toast } = useToast();
  
  const levelProgress = (userPoints / nextLevelPoints) * 100;
  
  const handleShareAchievements = () => {
    const shareText = `I've reached Level ${userLevel} and unlocked ${unlockedAchievements}/${totalAchievements} achievements on SleeperSheets! Check it out at sleepersheets.com`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My SleeperSheets Achievements',
        text: shareText,
        url: window.location.href,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        toast({
          title: "Copied to clipboard!",
          description: "Share your achievements with your league mates"
        });
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-yellow-400 to-amber-600 rounded-lg p-2">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Fantasy Manager Progression</CardTitle>
              <CardDescription>
                Track your achievements, earn points, and compete with other managers
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleShareAchievements}>
            <Sparkles className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Level Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass p-4 rounded-xl col-span-2">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gray-900 border-2 border-amber-500 flex items-center justify-center text-amber-400 font-bold">
                  {userLevel}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-white">Level {userLevel} Manager</h3>
                  <span className="text-sm text-amber-400">{userPoints}/{nextLevelPoints} XP</span>
                </div>
                <Progress value={levelProgress} className="h-2 mb-2" />
                <p className="text-xs text-gray-400">
                  {Math.round(nextLevelPoints - userPoints)} XP needed for Level {userLevel + 1}
                </p>
              </div>
            </div>
          </div>
          
          <div className="glass p-4 rounded-xl">
            <div className="flex items-center space-x-3 mb-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <h3 className="font-semibold text-white">Achievements</h3>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-white">{unlockedAchievements}/{totalAchievements}</div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Completion</div>
                <div className="text-lg font-semibold text-amber-400">
                  {Math.round((unlockedAchievements / totalAchievements) * 100)}%
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs for Achievements and Leaderboard */}
        <Tabs defaultValue="achievements" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="achievements" className="text-sm">
              <Trophy className="w-4 h-4 mr-2" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-sm">
              <Crown className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="achievements" className="mt-4">
            <AchievementsPanel leagueId={leagueId} />
          </TabsContent>
          
          <TabsContent value="leaderboard" className="mt-4">
            <LeaderboardPanel leagueId={leagueId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default GamificationDashboard;