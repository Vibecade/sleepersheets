
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeagueManager } from '@/hooks/useLeagueManager';
import { DemoProvider, useDemo } from '@/contexts/DemoContext';
import PageHead from '@/components/PageHead';
import LeagueHeader from '@/components/home/LeagueHeader';
import HeaderNavigation from '@/components/HeaderNavigation';
import Footer from '@/components/Footer';
import OfflineIndicator from '@/components/OfflineIndicator';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import AdBanner from '@/components/ads/AdBanner';
import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary';
import { DemoBanner } from '@/components/DemoBanner';
import LeagueData from '@/components/LeagueData';
import LeagueConnectionForm from '@/components/home/LeagueConnectionForm';
import UserDashboard from '@/components/dashboard/UserDashboard';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import SocialProofSection from '@/components/landing/SocialProofSection';
import GetStartedModal from '@/components/landing/GetStartedModal';
import { DEMO_LEAGUE_ID } from '@/utils/demoData';
import { useNavigate } from 'react-router-dom';

const IndexContent = React.memo(() => {
  const { user } = useAuth();
  const { setDemoMode } = useDemo();
  const navigate = useNavigate();
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const [userIsInteracting, setUserIsInteracting] = useState(false);
  const [showGetStartedModal, setShowGetStartedModal] = useState(false);
  const [showLeagueConnection, setShowLeagueConnection] = useState(false);
  
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
    handleQuickLoadFirstLeague,
    handleSelectLeagueFromUsername,
    handleBackToForm,
    handleRefreshLeagues,
    handleSelectLeague,
    handleBackToLeagues,
    handleRefreshData,
    handleResyncLeagueData,
    handleOwnershipChanged,
    userLeaguesData,
    showLeagueSelection,
  } = useLeagueManager();

  // Auto-show league connection interface when user signs in, reset on logout
  useEffect(() => {
    if (user) {
      setShowLeagueConnection(true);
      setUserIsInteracting(true);
      setIsHeaderCompact(true);
    } else {
      // Reset state when user logs out
      setShowLeagueConnection(false);
      setUserIsInteracting(false);
      setIsHeaderCompact(false);
    }
  }, [user]);

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

  const handleGetStarted = () => {
    setShowGetStartedModal(true);
  };

  const handleGetStartedOptionSelect = (option: 'connect' | 'auth' | 'demo') => {
    // Ensure modal is closed first
    setShowGetStartedModal(false);
    
    switch (option) {
      case 'connect':
        setShowLeagueConnection(true);
        setUserIsInteracting(true);
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
        setDemoMode(true);
        setLeagueId(DEMO_LEAGUE_ID);
        handleLeagueSubmit();
        setUserIsInteracting(true);
        setIsHeaderCompact(true);
        break;
    }
  };

  const handleBackToMarketing = () => {
    setShowLeagueConnection(false);
    setUserIsInteracting(false);
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
      {!leagueData && !userIsInteracting && <HeaderNavigation />}
      
      {/* Only show LeagueHeader when user is interacting or league data is loaded */}
      {(userIsInteracting || leagueData) && (
        <LeagueHeader 
          isCompact={isHeaderCompact}
          onToggleCompact={handleToggleCompact}
          canToggle={userIsInteracting || !!leagueData}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-12">
        <OfflineIndicator />
        <PWAInstallPrompt />
        
        <EnhancedErrorBoundary level="page">
          {!leagueData ? (
            <>
              {!showLeagueConnection ? (
                <>
                  {/* Marketing Landing Page */}
                  <AdBanner position="header" />
                  
                  <HeroSection onGetStarted={handleGetStarted} />
                  
                  <AdBanner position="between-content" />
                  
                  <FeaturesSection />
                  
                  <HowItWorksSection />
                  
                  <AdBanner position="between-content" />
                  
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
                  <AdBanner position="header" />
                  
                  {user ? (
                    <>
                     {/* Show UserDashboard for users with existing data, otherwise show connection form */}
                      <UserDashboard 
                        onSelectLeague={handleSelectLeague} 
                        onConnectLeague={() => {
                          setShowLeagueConnection(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }} 
                        showConnectionForm={!userLeaguesData && !showLeagueSelection}
                      />
                      
                      {/* Show connection form below dashboard for authenticated users with no data */}
                      {!userLeaguesData && !showLeagueSelection && (
                        <div className="mt-8">
                          <LeagueConnectionForm
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
                      
                      <LeagueConnectionForm
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
                      
                      {loading && !showLeagueSelection && (
                        <div className="mt-6 text-center">
                          <div className="text-muted-foreground">Loading...</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <LeagueData
              data={leagueData}
              onRefreshData={handleRefreshData}
              onResyncData={handleResyncLeagueData}
              onOwnershipChanged={handleOwnershipChanged}
            />
          )}
        </EnhancedErrorBoundary>
      </div>

      <Footer />
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

