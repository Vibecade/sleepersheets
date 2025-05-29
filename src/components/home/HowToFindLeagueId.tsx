
import React from 'react';
import { Lightbulb, ExternalLink } from 'lucide-react';

export const HowToFindLeagueId = () => {
  return (
    <div className="glass rounded-xl p-4 sm:p-6 border border-yellow-500/20 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full -translate-y-12 translate-x-12"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
          </div>
          <h4 className="font-semibold text-yellow-300 text-lg">
            How to find your League ID
          </h4>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center text-xs font-semibold text-yellow-400 mt-0.5 flex-shrink-0">
              1
            </div>
            <p className="text-yellow-200/90 leading-relaxed">
              Open the Sleeper app or visit <span className="font-medium text-yellow-300">sleeper.app</span>
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center text-xs font-semibold text-yellow-400 mt-0.5 flex-shrink-0">
              2
            </div>
            <p className="text-yellow-200/90 leading-relaxed">
              Navigate to your league dashboard
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center text-xs font-semibold text-yellow-400 mt-0.5 flex-shrink-0">
              3
            </div>
            <p className="text-yellow-200/90 leading-relaxed">
              Look at the URL - the League ID is the long number after <span className="font-mono text-yellow-300">/leagues/</span>
            </p>
          </div>
        </div>
        
        <div className="mt-6 p-3 sm:p-4 bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
          <p className="text-xs text-slate-400 mb-2">Example URL:</p>
          <div className="overflow-x-auto">
            <div className="flex items-center gap-1 sm:gap-2 font-mono text-xs sm:text-sm min-w-max">
              <span className="text-slate-500">sleeper.com/leagues/</span>
              <span className="bg-yellow-600/30 px-1 sm:px-2 py-1 rounded text-yellow-300 font-semibold">
                123456789012345678
              </span>
              <span className="text-slate-500">/team</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
