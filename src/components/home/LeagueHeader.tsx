
import React from 'react';
import { Trophy, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserMenu from '@/components/UserMenu';

const LeagueHeader = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="text-center py-16 px-4 relative">
      <div className="absolute top-4 right-4">
        {user ? (
          <UserMenu />
        ) : (
          <Button 
            onClick={() => navigate('/auth')}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Lock className="w-4 h-4" />
            <span>Sign In</span>
          </Button>
        )}
      </div>
      
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-4 shadow-2xl">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-white via-yellow-100 to-yellow-300 bg-clip-text text-transparent">
            SLEEPERSHEETS
          </h1>
        </div>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
          The ultimate salary cap and contract management tool for your fantasy football dynasty league
        </p>

        {!user && (
          <div className="mb-6 p-4 bg-amber-400/10 border border-amber-400/20 rounded-lg max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-2 text-amber-400">
              <Lock className="w-5 h-5" />
              <span className="font-medium">Read-Only Mode</span>
            </div>
            <p className="text-sm text-amber-300 mt-2">
              Sign in to modify salary caps, contracts, and claim league ownership
            </p>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>Real-time salary tracking</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Contract management</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Trade simulation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>Protected league ownership</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueHeader;
