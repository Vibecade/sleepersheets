
import React, { useState, useEffect } from 'react';
import Footer from '@/components/Footer';
import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary';
import LeagueHeader from '@/components/home/LeagueHeader';
import LeagueConnectionForm from '@/components/home/LeagueConnectionForm';
import PageHead from '@/components/PageHead';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import OfflineIndicator from '@/components/OfflineIndicator';
import UserDashboard from '@/components/dashboard/UserDashboard';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useLeagueManager } from '@/hooks/useLeagueManager';
import LeagueView from '@/components/home/LeagueView';

const Index = React.memo(() => {
  const { user } = useAuth();
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const [userIsInteracting, setUserIsInteracting] = useState(false);
  
  const {
    leagueId,
    setLeagueId,
    username,
    setUsername,
    leagueData,
    loading,
    ownershipStatus,
    handleLeagueSubmit,
    handleUsernameSubmit,
    handleSelectLeague,
    handleBackToLeagues,
    handleRefreshData,
    handleResyncLeagueData,
    handleOwnershipChanged,
  } = useLeagueManager();

  // Auto-compact header when user starts interacting with forms or when league is loaded
  useEffect(() => {
    if ((leagueId.trim() || username.trim()) || leagueData) {
      setUserIsInteracting(true);
      setIsHeaderCompact(true);
    } else if (!leagueId.trim() && !username.trim() && !leagueData) {
      setUserIsInteracting(false);
      setIsHeaderCompact(false);
    }
  }, [leagueId, username, leagueData]);

  const handleToggleCompact = () => {
    setIsHeaderCompact(!isHeaderCompact);
  };

  return (
    <div className="min-h-screen">
      <PageHead
        title="Fantasy Football Salary Cap Management"
        description="The ultimate salary cap and contract management tool for your fantasy football dynasty league. Track salaries, manage contracts, simulate trades, and export league data."
      />
      
      <LeagueHeader 
        isCompact={isHeaderCompact}
        onToggleCompact={handleToggleCompact}
        canToggle={userIsInteracting || !!leagueData}
      />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <OfflineIndicator />
        <PWAInstallPrompt />
        
        <EnhancedErrorBoundary level="page">
          {!leagueData ? (
            <div className="max-w-4xl mx-auto">
              {user ? (
                <UserDashboard onSelectLeague={handleSelectLeague} />
              ) : (
                <Tabs defaultValue="connect" className="space-y-8">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="connect">Connect League</TabsTrigger>
                    <TabsTrigger value="dashboard">My Dashboard</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="connect" className="space-y-8">
                    <LeagueConnectionForm
                      leagueId={leagueId}
                      setLeagueId={setLeagueId}
                      username={username}
                      setUsername={setUsername}
                      onLeagueSubmit={handleLeagueSubmit}
                      onUsernameSubmit={handleUsernameSubmit}
                      loading={loading}
                    />
                    
                    {loading && (
                      <div className="mt-6">
                        <ProgressIndicator
                          message={'Loading...'}
                          showPercentage={false}
                        />
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="dashboard">
                    <UserDashboard onSelectLeague={handleSelectLeague} />
                  </TabsContent>
                </Tabs>
              )}
            </div>
          ) : (
            <LeagueView
              leagueData={leagueData}
              onRefreshData={handleRefreshData}
              onResyncData={handleResyncLeagueData}
              onBackToLeagues={handleBackToLeagues}
              onOwnershipChanged={handleOwnershipChanged}
              ownershipStatus={ownershipStatus}
            />
          )}
        </EnhancedErrorBoundary>
      </div>

      <Footer />
    </div>
  );
});

Index.displayName = 'Index';

export default Index;
