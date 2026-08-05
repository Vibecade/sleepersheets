
import React from 'react';
import { Trophy, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useNavigate } from 'react-router';
import { useIsMobile } from '@/hooks/use-mobile';
import UserMenu from '@/components/UserMenu';

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
                <span className="hidden xs:inline font-tech text-[10px] sm:text-xs">Hit the Field</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-8 sm:py-12 lg:py-16 px-4 relative field-pattern animate-header-expand">
      
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
            <span className="hidden xs:inline font-tech text-[10px] sm:text-xs">Hit the Field</span>
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
        
        {/* Command Center Status */}
        <div className="glass-card p-4 sm:p-6 max-w-3xl mx-auto mb-6 animate-stadium-entrance">
          <div className="text-center">
            <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">
              <span className="font-headline text-primary">COMMAND CENTER</span> Status: 
              <span className="font-headline text-success ml-2">OPERATIONAL</span>
            </p>
          </div>
        </div>

        {!user && (
          <div className="mb-6 p-3 sm:p-4 bg-secondary/10 border border-secondary/20 rounded-lg max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-2 text-secondary">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-sm sm:text-base">Read-Only Mode</span>
            </div>
            <p className="text-xs sm:text-sm text-secondary/80 mt-2">
              Sign in to modify salary caps, contracts, and claim league ownership
            </p>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 text-xs text-gray-400 px-2 mt-6">
          <div className="flex items-center space-x-1.5 backdrop-blur-sm bg-white/5 p-1.5 px-2.5 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span>System Online</span>
          </div>
          <div className="flex items-center space-x-1.5 backdrop-blur-sm bg-white/5 p-1.5 px-2.5 rounded-full">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
            <span>Data Synced</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueHeader;
