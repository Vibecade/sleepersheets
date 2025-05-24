
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, HelpCircle, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LeagueHeader = () => {
  return (
    <header className="glass-header relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="flex items-start space-x-6">
            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-500 via-blue-600 to-purple-600 rounded-2xl p-4 shadow-xl">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-pulse"></div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h1 className="text-5xl lg:text-6xl font-bold gradient-text mb-3">
                  SleeperSheets
                </h1>
                <div className="flex items-center space-x-2 text-slate-400 text-sm font-medium">
                  <BarChart3 className="w-4 h-4" />
                  <span>Fantasy Football Analytics Platform</span>
                </div>
              </div>
              
              <p className="text-slate-300 text-xl max-w-2xl leading-relaxed">
                Transform your fantasy football data into actionable insights with 
                professional-grade analytics and beautiful exports.
              </p>
              
              <div className="flex items-center space-x-4 pt-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-slate-400">Live Data</span>
                </div>
                <div className="w-1 h-4 bg-slate-600"></div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-slate-400">Instant Export</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/how-to">
              <Button 
                variant="outline" 
                className="glass-button group relative overflow-hidden"
                size="lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <HelpCircle className="w-5 h-5 relative z-10" />
                <span className="relative z-10">How It Works</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
