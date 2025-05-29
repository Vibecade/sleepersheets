
import React from 'react';
import { Trophy } from 'lucide-react';
import UserMenu from '@/components/UserMenu';

const LeagueHeader = () => {
  return (
    <div className="text-center py-16 px-4 relative">
      <div className="absolute top-4 right-4">
        <UserMenu />
      </div>
      
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-4 shadow-2xl">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-white via-yellow-100 to-yellow-300 bg-clip-text text-transparent">
            DYNASTY
          </h1>
        </div>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
          The ultimate salary cap and contract management tool for your fantasy football dynasty league
        </p>

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
