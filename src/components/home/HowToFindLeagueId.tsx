import React from 'react';
import { Lightbulb } from 'lucide-react';

export const HowToFindLeagueId = () => {
  return (
    <div className="glass p-4 sm:p-6 border border-primary/20 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-12 translate-x-12"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/20">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <h4 className="font-semibold text-primary text-lg">
            How to find your League ID
          </h4>
        </div>

        <div className="space-y-3">
          {[
            <>Open the Sleeper app or visit <span className="font-medium text-primary">sleeper.app</span></>,
            'Navigate to your league dashboard',
            <>Look at the URL - the League ID is the long number after <span className="font-mono text-primary">/leagues/</span></>,
          ].map((content, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-semibold text-primary mt-0.5 flex-shrink-0">
                {i + 1}
              </div>
              <p className="text-foreground/90 leading-relaxed">{content}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-3 sm:p-4 bg-card border border-border overflow-hidden">
          <p className="text-xs text-muted-foreground mb-2">Example URL:</p>
          <div className="overflow-x-auto">
            <div className="flex items-center gap-1 sm:gap-2 font-mono text-xs sm:text-sm min-w-max">
              <span className="text-muted-foreground">sleeper.com/leagues/</span>
              <span className="bg-primary px-1 sm:px-2 py-1 text-primary-foreground font-semibold">
                123456789012345678
              </span>
              <span className="text-muted-foreground">/team</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
