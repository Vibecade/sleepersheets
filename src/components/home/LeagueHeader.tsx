
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LeagueHeader = () => {
  return (
    <div className="glass-header border-b border-white/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-emerald-600/10 animate-pulse"></div>
      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 rounded-2xl p-4 shadow-2xl pulse-glow">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">SleeperSheets</h1>
              <p className="text-gray-300 text-lg">Transform your fantasy football data into actionable insights</p>
            </div>
          </div>
          <Link to="/how-to">
            <Button variant="outline" className="flex items-center space-x-2">
              <HelpCircle className="w-4 h-4" />
              <span>How To Use</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
