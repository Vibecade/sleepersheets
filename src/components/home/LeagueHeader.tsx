
import React from 'react';
import { Trophy, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import UserMenu from '@/components/UserMenu';
import HeaderNavigation from '@/components/HeaderNavigation';

interface LeagueHeaderProps {
  isCompact?: boolean;
  onToggleCompact?: () => void;
  canToggle?: boolean;
}

const LeagueHeader: React.FC<LeagueHeaderProps> = ({ 
  isCompact = false, 
  onToggleCompact,
  canToggle = false 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (isCompact) {
    return (
      <div className="text-center py-3 px-4 relative field-pattern animate-header-compact">
        <HeaderNavigation />
        
        {/* Compact Header */}
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-primary to-primary-glow rounded-2xl p-2 shadow-lg">
              <Trophy className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="war-room-title text-xl sm:text-2xl md:text-3xl">
              SLEEPERSHEETS
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {canToggle && onToggleCompact && (
              <Button
                onClick={onToggleCompact}
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary-glow"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            )}
            {user ? (
              <UserMenu />
            ) : (
              <Button 
                onClick={() => navigate('/auth')}
                variant="war"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Lock className="w-4 h-4" />
                <span className="hidden xs:inline font-tech text-xs sm:text-sm">Hit the Field</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-8 sm:py-12 lg:py-16 px-4 relative field-pattern animate-header-expand">
      <HeaderNavigation />
      
      {/* Stadium Command Center Header */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        {canToggle && onToggleCompact && (
          <Button
            onClick={onToggleCompact}
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary-glow"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        )}
        {user ? (
          <UserMenu />
        ) : (
          <Button 
            onClick={() => navigate('/auth')}
            variant="war"
            size={isMobile ? "sm" : "default"}
            className="flex items-center space-x-2 animate-stadium-entrance"
          >
            <Lock className="w-4 h-4" />
            <span className="hidden xs:inline font-tech text-xs sm:text-sm">Hit the Field</span>
          </Button>
        )}
      </div>
      
      {/* War Room Command Center Display */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center space-y-6 mb-8">
          {/* NFL Stadium Helmet Display */}
          <div className="relative">
            <div className="bg-gradient-to-br from-primary to-primary-glow rounded-3xl p-4 sm:p-6 shadow-lg animate-helmet-glow">
              <Trophy className="w-12 h-12 sm:w-16 lg:w-20 sm:h-16 lg:h-20 text-primary-foreground" />
            </div>
            <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          
          {/* War Room Title */}
          <div className="text-center space-y-2">
            <h1 className="war-room-title text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl animate-stadium-entrance">
              SLEEPERSHEETS
            </h1>
            <div className="scoreboard-text text-sm sm:text-base text-primary uppercase tracking-widest">
              Fantasy Football War Room Command Center
            </div>
          </div>
        </div>
        
        {/* Command Center Description */}
        <div className="glass-card p-6 sm:p-8 max-w-4xl mx-auto mb-8 animate-stadium-entrance">
          <p className="text-lg sm:text-xl lg:text-2xl text-foreground/90 leading-relaxed font-sans">
            <span className="font-headline text-primary">DOMINATE</span> your fantasy football dynasty league with the ultimate salary cap and contract management command center. 
            <span className="font-headline text-secondary"> STRATEGIZE</span> like a championship front office. 
            <span className="font-headline text-success"> EXECUTE</span> every move with precision.
          </p>
        </div>

        {!user && (
          <div className="mb-6 p-3 sm:p-4 bg-amber-400/10 border border-amber-400/20 rounded-lg max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-2 text-amber-400">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-sm sm:text-base">Read-Only Mode</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-300 mt-2">
              Sign in to modify salary caps, contracts, and claim league ownership
            </p>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400 px-2 mt-8">
          <div className="flex items-center space-x-2 backdrop-blur-sm bg-white/5 p-2 px-3 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span>Real-time salary tracking</span>
          </div>
          <div className="flex items-center space-x-2 backdrop-blur-sm bg-white/5 p-2 px-3 rounded-full">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <span>Contract management</span>
          </div>
          <div className="flex items-center space-x-2 backdrop-blur-sm bg-white/5 p-2 px-3 rounded-full">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            <span>Trade simulation</span>
          </div>
          <div className="flex items-center space-x-2 backdrop-blur-sm bg-white/5 p-2 px-3 rounded-full">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
            <span>Protected league ownership</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueHeader;
