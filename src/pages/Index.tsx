import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLeagueManager } from '@/hooks/useLeagueManager';
import { DemoProvider } from '@/contexts/DemoContext';
import { useDemo } from '@/contexts/demo-context';
import PageHead from '@/components/PageHead';
import LeagueHeader from '@/components/home/LeagueHeader';
import HeaderNavigation from '@/components/HeaderNavigation';
import Footer from '@/components/Footer';
import OfflineIndicator from '@/components/OfflineIndicator';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary';
import { DemoBanner } from '@/components/DemoBanner';
import HeroSection from '@/components/landing/HeroSection';
import { UnifiedLoading } from '@/components/ui/unified-loading';
import { Card } from '@/components/ui/card';
import FeaturesSection from '@/components/landing/FeaturesSection';
import SocialProofSection from '@/components/landing/SocialProofSection';
import GetStartedModal from '@/components/landing/GetStartedModal';
import ReturningUserPrompt from '@/components/landing/ReturningUserPrompt';
import { DEMO_LEAGUE_ID } from '@/utils/demoData';
import { useNavigate } from 'react-router';
import {
  LazyLeagueConnectionForm,
  LazyLeagueData,
  LazyUserDashboard,
} from '@/components/LazyComponents';

type HomeViewMode = 'marketing' | 'connect';

const SectionLoadingCard = ({ message }: { message: string }) => (
  <Card className="p-8 border-primary/15">
    <div className="space-y-4">
      <UnifiedLoading variant="text" size="lg" />
      <p className="text-sm text-muted-foreground text-center">{message}</p>
    </div>
  </Card>
);

const IndexContent = React.memo(() => {
  const { user } = useAuth();
  const { setDemoMode } = useDemo();
  const navigate = useNavigate();
  const previousUserIdRef = useRef<string | null>(null);
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const [viewMode, setViewMode] = useState<HomeViewMode>('marketing');
  const [showGetStartedModal, setShowGetStartedModal] = useState(false);
  
  const {
    leagueId,
    setLeagueId,
    username,
    setUsername,
    leagueData,
    loading,
    handleLeagueSubmit,
    handleUsernameSubmit,
    handleQuickLoadFirstLeague,
    handleSelectLeagueFromUsername,
    handleBackToForm,
    handleRefreshLeagues,
    handleSelectLeague,
    handleRefreshData,
    handleResyncLeagueData,
    handleOwnershipChanged,
    userLeaguesData,
    showLeagueSelection,
    recentLeagues,
  } = useLeagueManager();

  const hasLeagueData = Boolean(leagueData);
  const showConnectionView = viewMode === 'connect' && !hasLeagueData;

  // Keep signed-in users in the connection flow.
  useEffect(() => {
    if (user) {
      previousUserIdRef.current = user.id;
      setViewMode('connect');
      setIsHeaderCompact(true);
      return;
    }

    if (previousUserIdRef.current && !hasLeagueData) {
      previousUserIdRef.current = null;
      setViewMode('marketing');
      setIsHeaderCompact(false);
    }
  }, [user, hasLeagueData]);

  const handleToggleCompact = () => {
    setIsHeaderCompact(!isHeaderCompact);
  };

  const handleGetStarted = () => {
    setShowGetStartedModal(true);
  };

  const handleGetStartedOptionSelect = (option: 'connect' | 'auth' | 'demo') => {
    // Ensure modal is closed first
    setShowGetStartedModal(false);
    
    switch (option) {
      case 'connect':
        setViewMode('connect');
        setIsHeaderCompact(true);
        // Scroll to top to show the connection form
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'auth':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Small delay to ensure React processes modal closing before navigation
        setTimeout(() => {
          navigate('/auth');
        }, 100);
        break;
      case 'demo':
        setViewMode('connect');
        setDemoMode(true);
        setLeagueId(DEMO_LEAGUE_ID);
        handleLeagueSubmit(DEMO_LEAGUE_ID);
        setIsHeaderCompact(true);
        break;
    }
  };

  const handleBackToMarketing = () => {
    setViewMode('marketing');
    setIsHeaderCompact(false);
  };

  return (
    <div className="min-h-screen">
      <PageHead
        title="Fantasy Football Salary Cap Management"
        description="The ultimate salary cap and contract management tool for your fantasy football dynasty league. Track salaries, manage contracts, simulate trades, and export league data."
      />
      <DemoBanner />
      
      {/* Show HeaderNavigation only on landing page */}
      {!hasLeagueData && viewMode === 'marketing' && <HeaderNavigation />}
      
      {/* Show the home header only while connecting to a league */}
      {showConnectionView && (
        <LeagueHeader 
          isCompact={isHeaderCompact}
          onToggleCompact={handleToggleCompact}
          canToggle={showConnectionView}
        />
      )}

      <div className={`max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 ${!hasLeagueData && viewMode === 'marketing' ? 'pt-6 pb-12 sm:pt-8 sm:pb-14' : 'py-12'}`}>
        <OfflineIndicator />
        <PWAInstallPrompt />
        
        <EnhancedErrorBoundary level="page">
          {!hasLeagueData ? (
            <>
              {viewMode === 'marketing' ? (
                <>
                  {/* Quick access for returning users */}
                  {recentLeagues.length > 0 && (
                    <ReturningUserPrompt
                      recentLeagues={recentLeagues}
                      onSelectLeague={handleSelectLeague}
                      onConnectNew={() => {
                        setViewMode('connect');
                        setIsHeaderCompact(true);
                      }}
                    />
                  )}
                  
                  {/* Marketing Landing Page */}
                  <HeroSection onGetStarted={handleGetStarted} />
                  
                  <FeaturesSection />
                  
                  <SocialProofSection />
                  
                  {/* Get Started Modal */}
                  <GetStartedModal
                    isOpen={showGetStartedModal}
                    onClose={() => setShowGetStartedModal(false)}
                    onSelectOption={handleGetStartedOptionSelect}
                  />
                </>
              ) : (
                /* League Connection Interface */
                <div className="max-w-4xl mx-auto">
                  
                  {user ? (
                    <>
                      {/* Show UserDashboard for users with existing data, otherwise show connection form */}
                      <Suspense fallback={<SectionLoadingCard message="Loading your dashboard..." />}>
                        <LazyUserDashboard 
                          onSelectLeague={handleSelectLeague} 
                          onConnectLeague={() => {
                            setViewMode('connect');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }} 
                          showConnectionForm={!userLeaguesData && !showLeagueSelection}
                        />
                      </Suspense>
                      
                      {/* Show connection form below dashboard for authenticated users with no data */}
                      {!userLeaguesData && !showLeagueSelection && (
                        <div className="mt-8">
                          <Suspense fallback={<SectionLoadingCard message="Loading league connection tools..." />}>
                            <LazyLeagueConnectionForm
                              leagueId={leagueId}
                              setLeagueId={setLeagueId}
                              username={username}
                              setUsername={setUsername}
                              onLeagueSubmit={handleLeagueSubmit}
                              onUsernameSubmit={handleUsernameSubmit}
                              onQuickLoadFirstLeague={handleQuickLoadFirstLeague}
                              onSelectLeague={handleSelectLeagueFromUsername}
                              onBackToForm={handleBackToForm}
                              onRefreshLeagues={handleRefreshLeagues}
                              loading={loading}
                              userLeaguesData={userLeaguesData}
                              showLeagueSelection={showLeagueSelection}
                            />
                          </Suspense>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-8">
                      {/* Back to Marketing Button */}
                      <div className="text-center">
                        <button
                          onClick={handleBackToMarketing}
                          className="text-primary hover:text-primary-glow transition-colors text-sm"
                        >
                          ← Back to Home
                        </button>
                      </div>
                      
                      <Suspense fallback={<SectionLoadingCard message="Loading league connection tools..." />}>
                        <LazyLeagueConnectionForm
                          leagueId={leagueId}
                          setLeagueId={setLeagueId}
                          username={username}
                          setUsername={setUsername}
                          onLeagueSubmit={handleLeagueSubmit}
                          onUsernameSubmit={handleUsernameSubmit}
                          onQuickLoadFirstLeague={handleQuickLoadFirstLeague}
                          onSelectLeague={handleSelectLeagueFromUsername}
                          onBackToForm={handleBackToForm}
                          onRefreshLeagues={handleRefreshLeagues}
                          loading={loading}
                          userLeaguesData={userLeaguesData}
                          showLeagueSelection={showLeagueSelection}
                        />
                      </Suspense>
                      
                      {loading && !showLeagueSelection && (
                        <div className="mt-6">
                          <Card className="p-8">
                            <UnifiedLoading variant="text" size="lg" />
                          </Card>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <Suspense fallback={<SectionLoadingCard message="Loading league workspace..." />}>
              <LazyLeagueData
                data={leagueData}
                onRefreshData={handleRefreshData}
                onResyncData={handleResyncLeagueData}
                onOwnershipChanged={handleOwnershipChanged}
              />
            </Suspense>
          )}
        </EnhancedErrorBoundary>
      </div>

      {!hasLeagueData && <Footer />}
    </div>
  );
});

const Index = React.memo(() => {
  return (
    <DemoProvider>
      <IndexContent />
    </DemoProvider>
  );
});

export default Index;

Index.displayName = 'Index';
