
import React from 'react';
import { Trophy, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import UserMenu from '@/components/UserMenu';
import HeaderNavigation from '@/components/HeaderNavigation';

const LeagueHeader = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div className="text-center py-8 sm:py-12 lg:py-16 px-4 relative">
      <HeaderNavigation />
      
      <div className="absolute top-4 right-4">
        {user ? (
          <UserMenu />
        ) : (
          <Button 
            onClick={() => navigate('/auth')}
            variant="outline"
            size={isMobile ? "sm" : "default"}
            className="flex items-center space-x-2"
          >
            <Lock className="w-4 h-4" />
            <span className="hidden xs:inline">Sign In</span>
          </Button>
        )}
      </div>
      
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-3 sm:p-4 shadow-2xl">
            <Trophy className="w-8 h-8 sm:w-10 lg:w-12 sm:h-10 lg:h-12 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black bg-gradient-to-r from-white via-yellow-100 to-yellow-300 bg-clip-text text-transparent text-center sm:text-left text-glow">
            SLEEPERSHEETS
          </h1>
        </div>
        
        <p className="text-lg sm:text-xl lg:text-2xl text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2">
          The ultimate salary cap and contract management tool for your fantasy football dynasty league
        </p>

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
