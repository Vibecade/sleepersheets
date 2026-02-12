import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Shield, BarChart3, CheckCircle2 } from 'lucide-react';

const SocialProofSection: React.FC = () => {
  const benefits = [
    'No ads or upsell blocks in league workflows',
    'Commissioner controls with ownership verification',
    'Fast load and sync behavior for daily use',
    'Exports for reports, meetings, and archives',
    'Built for desktop and mobile management'
  ];

  const trustStats = [
    {
      icon: Trophy,
      title: 'Dynasty & Keeper Ready',
      description: 'Built for long-term contract and cap strategy',
    },
    {
      icon: Shield,
      title: 'Ownership Protected',
      description: 'Critical league settings are protected by verification',
    },
    {
      icon: BarChart3,
      title: 'Analytics Driven',
      description: 'See trends, efficiency, and weekly performance clearly',
    },
  ];

  return (
    <section className="py-10 sm:py-14 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="font-sans normal-case tracking-tight text-2xl sm:text-3xl lg:text-4xl font-semibold mb-3">
            Built for serious league operations
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto mb-7">
            A focused app experience that prioritizes league management speed, clarity, and control.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trustStats.map((stat) => (
              <Card key={stat.title} className="glass-card border-border/50 text-left">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-background/50 border border-white/10">
                      <stat.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold mb-1">{stat.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{stat.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 sm:p-8">
          <h3 className="font-sans normal-case text-xl sm:text-2xl font-semibold text-center mb-6">
            Why managers keep using SleeperSheets
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                <span className="text-sm sm:text-base text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
