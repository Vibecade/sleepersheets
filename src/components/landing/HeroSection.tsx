import React from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, TrendingUp, Users, BarChart3 } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  return (
    <section className="relative text-center py-16 sm:py-20 lg:py-24 px-4 field-pattern">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5"></div>
      
      <div className="relative max-w-6xl mx-auto">
        {/* Hero Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="bg-gradient-to-br from-primary to-primary-glow rounded-3xl p-6 shadow-lg animate-stadium-entrance">
              <Trophy className="w-16 h-16 sm:w-20 sm:h-20 text-primary-foreground" />
            </div>
            <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
          </div>
        </div>

        {/* Main Headline */}
        <h1 className="war-room-title text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-6 animate-stadium-entrance">
          SLEEPERSHEETS
        </h1>
        
        <div className="scoreboard-text text-base sm:text-lg text-primary uppercase tracking-widest mb-8">
          Fantasy Football War Room Command Center
        </div>

        {/* Value Proposition */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl text-foreground font-bold mb-6 leading-tight">
            The <span className="gradient-text">Ultimate</span> Dynasty League 
            <span className="text-secondary">Management Platform</span>
          </h2>
          
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            Stop using spreadsheets. Start winning championships with professional-grade tools 
            built specifically for dynasty fantasy football leagues.
          </p>
        </div>

        {/* Key Stats */}
        <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mb-12">
          <div className="flex items-center space-x-2 backdrop-blur-sm bg-white/5 p-3 px-4 rounded-full">
            <TrendingUp className="w-5 h-5 text-success" />
            <span className="text-sm font-medium">Real-time Tracking</span>
          </div>
          <div className="flex items-center space-x-2 backdrop-blur-sm bg-white/5 p-3 px-4 rounded-full">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Multi-League Support</span>
          </div>
          <div className="flex items-center space-x-2 backdrop-blur-sm bg-white/5 p-3 px-4 rounded-full">
            <BarChart3 className="w-5 h-5 text-secondary" />
            <span className="text-sm font-medium">Advanced Analytics</span>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="space-y-4">
          <Button
            onClick={onGetStarted}
            size="lg"
            className="text-lg px-8 py-4 h-auto bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-primary-foreground font-bold shadow-glow hover:shadow-glow-strong transition-all duration-300 animate-stadium-entrance"
          >
            Get Started Free
          </Button>
          
          <div className="text-sm text-muted-foreground">
            ✨ Start for Free • No credit card required • 30 seconds to start
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;