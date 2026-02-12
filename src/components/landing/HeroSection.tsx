import React from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, TrendingUp, Users, BarChart3, Sparkles, ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  const handleExploreFeatures = () => {
    const target = document.getElementById('features-section');
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="relative text-center py-14 sm:py-18 lg:py-24 px-4 field-pattern overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5"></div>
      <div className="absolute -top-24 -left-24 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-secondary/10 blur-3xl" />
      
      <div className="relative max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs sm:text-sm mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Built for dynasty, keeper, and redraft leagues
        </div>

        {/* Hero Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="bg-gradient-to-br from-primary to-primary-glow rounded-3xl p-5 sm:p-6 shadow-lg animate-stadium-entrance">
              <Trophy className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-primary-foreground" />
            </div>
            <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
          </div>
        </div>

        {/* Main Headline */}
        <h1 className="war-room-title text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-4 animate-stadium-entrance">
          SLEEPERSHEETS
        </h1>
        
        <div className="scoreboard-text text-xs sm:text-sm md:text-base text-primary uppercase tracking-widest mb-8">
          Fantasy Football War Room Command Center
        </div>

        {/* Value Proposition */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl text-foreground font-bold mb-5 leading-tight">
            The <span className="gradient-text">Ultimate</span> Fantasy Football 
            <span className="text-secondary">Management Platform</span>
          </h2>
          
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-7">
            Stop using spreadsheets. Start winning championships with professional-grade tools 
            for dynasty, keeper, and regular fantasy football leagues.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto text-sm sm:text-base">
            <div className="glass-card p-4 rounded-xl text-left">
              <div className="font-semibold text-primary mb-2">Dynasty & Keeper Leagues</div>
              <div className="text-muted-foreground">Seamless year-to-year transitions with advanced contract tracking and salary cap management</div>
            </div>
            <div className="glass-card p-4 rounded-xl text-left">
              <div className="font-semibold text-secondary mb-2">Regular Leagues</div>
              <div className="text-muted-foreground">Track performance vs league averages and gain insights with advanced analytics</div>
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-10">
          <div className="flex items-center space-x-2 backdrop-blur-sm bg-white/5 p-2.5 px-4 rounded-full border border-white/10">
            <TrendingUp className="w-5 h-5 text-success" />
            <span className="text-sm font-medium">Real-time Tracking</span>
          </div>
          <div className="flex items-center space-x-2 backdrop-blur-sm bg-white/5 p-2.5 px-4 rounded-full border border-white/10">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Multi-League Support</span>
          </div>
          <div className="flex items-center space-x-2 backdrop-blur-sm bg-white/5 p-2.5 px-4 rounded-full border border-white/10">
            <BarChart3 className="w-5 h-5 text-secondary" />
            <span className="text-sm font-medium">Advanced Analytics</span>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={onGetStarted}
              size="lg"
              className="w-full sm:w-auto text-base sm:text-lg px-8 py-4 h-auto bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-primary-foreground font-bold shadow-glow hover:shadow-glow-strong transition-all duration-300 animate-stadium-entrance"
            >
              Get Started Free
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleExploreFeatures}
              className="w-full sm:w-auto text-base px-8 py-4 h-auto border-primary/40 hover:border-primary/70 hover:bg-primary/10"
            >
              Explore Features
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <Button
            variant="link"
            className="text-muted-foreground hover:text-foreground text-sm p-0 h-auto"
            onClick={handleExploreFeatures}
          >
            See what is included before connecting your league
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
