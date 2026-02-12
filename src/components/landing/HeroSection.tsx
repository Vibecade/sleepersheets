import React from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, TrendingUp, Users, BarChart3, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

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
    <section className="relative py-10 sm:py-14 lg:py-16 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute -top-28 right-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 lg:gap-8 items-stretch">
          <div className="glass-card p-6 sm:p-8 lg:p-10 rounded-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs sm:text-sm mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              Built for dynasty, keeper, and redraft leagues
            </div>

            <h1 className="font-sans normal-case tracking-tight text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground mb-4 leading-tight">
              Manage your fantasy league faster, with fewer manual steps.
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6 max-w-2xl">
              SleeperSheets gives commissioners and managers one clean workspace for contracts, cap tracking, transactions, and exports.
            </p>

            <div className="flex flex-wrap gap-2 mb-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-background/40 px-3 py-1.5 text-sm">
                <TrendingUp className="w-4 h-4 text-success" />
                Real-time tracking
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-background/40 px-3 py-1.5 text-sm">
                <Users className="w-4 h-4 text-primary" />
                Multi-league support
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-background/40 px-3 py-1.5 text-sm">
                <BarChart3 className="w-4 h-4 text-secondary" />
                Advanced analytics
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                onClick={onGetStarted}
                size="lg"
                className="text-base px-8 h-11 bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-primary-foreground font-semibold"
              >
                Get Started Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleExploreFeatures}
                className="text-base px-6 h-11 border-primary/40 hover:border-primary/70 hover:bg-primary/10"
              >
                Explore Features
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          <div className="glass-card p-6 sm:p-7 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-5">
              <div className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow p-3">
                <Trophy className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="inline-flex items-center gap-2 text-xs text-success bg-success/10 border border-success/25 px-2.5 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                Ownership protected
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-background/30 p-4">
                <p className="text-sm font-semibold mb-1">For dynasty and keeper leagues</p>
                <p className="text-sm text-muted-foreground">Track contracts, dead cap, and long-term payroll strategy without spreadsheets.</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/30 p-4">
                <p className="text-sm font-semibold mb-1">For regular redraft leagues</p>
                <p className="text-sm text-muted-foreground">Measure trends, compare teams, and export league data for weekly recaps.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
