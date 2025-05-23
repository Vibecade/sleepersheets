
import React from 'react';
import { Star } from 'lucide-react';

export const HowToFindLeagueId = () => {
  return (
    <div className="glass border border-blue-400/30 rounded-xl p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover-lift">
      <h4 className="font-semibold text-blue-300 mb-3 flex items-center">
        <Star className="w-4 h-4 mr-2" />
        How to find your League ID:
      </h4>
      <ol className="text-sm text-blue-200 space-y-2 list-decimal list-inside leading-relaxed">
        <li>Open the Sleeper app or website</li>
        <li>Navigate to your league</li>
        <li>Look at the URL - the League ID is the long number</li>
        <li>Example: sleeper.app/leagues/<span className="font-mono bg-blue-600/30 px-2 py-1 rounded">123456789</span>/team</li>
      </ol>
    </div>
  );
};
