
import React, { useState, useEffect } from 'react';
import Footer from '@/components/Footer';
import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary';
import LeagueHeader from '@/components/home/LeagueHeader';
import LeagueConnectionForm from '@/components/home/LeagueConnectionForm';
import PageHead from '@/components/PageHead';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import OfflineIndicator from '@/components/OfflineIndicator';
import UserDashboard from '@/components/dashboard/UserDashboard';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import SocialProofSection from '@/components/landing/SocialProofSection';
import GetStartedModal from '@/components/landing/GetStartedModal';
import { useAuth } from '@/contexts/AuthContext';
import { useLeagueManager } from '@/hooks/useLeagueManager';
import LeagueView from '@/components/home/LeagueView';
import AdBanner from '@/components/ads/AdBanner';
import { useNavigate } from 'react-router-dom';

const Index = React.memo(() => {
  const { user } = useAuth();
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

  const handleGetStartedOptionSelect = (option: 'league-id' | 'username' | 'auth' | 'demo') => {
    switch (option) {
      case 'league-id':
      case 'username':
        setShowLeagueConnection(true);
        setUserIsInteracting(true);
        setIsHeaderCompact(true);
        break;
      case 'auth':
        navigate('/auth');
        break;
      case 'demo':
        // Load demo league directly
        setLeagueId('784462448236060672'); // Demo league ID
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
                    <UserDashboard onSelectLeague={handleSelectLeague} />
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
