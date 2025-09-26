import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Link2, 
  Settings, 
  FileText, 
  Trophy,
  ArrowRight
} from 'lucide-react';

const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      icon: Link2,
      step: '01',
      title: 'Connect Your League',
      description: 'Enter your Sleeper League ID or username to automatically sync your league data. We pull rosters, transactions, and league settings instantly.',
      color: 'text-primary'
    },
    {
      icon: Settings,
      step: '02', 
      title: 'Configure Your League',
      description: 'Set up salary cap rules, contract lengths, and league settings. For regular leagues, configure performance tracking and analytics preferences.',
      color: 'text-secondary'
    },
    {
      icon: FileText,
      step: '03',
      title: 'Track & Analyze',
      description: 'For dynasty/keeper: manage contracts and salaries. For regular leagues: track performance metrics and compare against league averages.',
      color: 'text-success'
    },
    {
      icon: Trophy,
      step: '04',
      title: 'Dominate Your League',
      description: 'Use trade simulation, cap planning, and analytics to make championship-caliber decisions. Stay ahead of your competition with data-driven strategy.',
      color: 'text-chart-3'
    }
  ];

  return (
    <section className="py-16 sm:py-20 px-4 bg-background/50">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Get up and running in minutes. No complex setup, no manual data entry - just connect and dominate.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8 lg:space-y-12">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* Step Content */}
              <div className={`flex-1 ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                <Card className="glass-card hover-lift h-full">
                  <CardContent className="p-8">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-background/50">
                        <step.icon className={`w-6 h-6 ${step.color}`} />
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="scoreboard-text text-2xl text-muted-foreground">
                          {step.step}
                        </span>
                        <h3 className="text-xl font-bold">{step.title}</h3>
                      </div>
                    </div>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Step Visual */}
              <div className={`flex-1 ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                <div className="glass-card p-8 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-background to-background/50 flex items-center justify-center border border-${step.color.replace('text-', '')}/20`}>
                      <step.icon className={`w-10 h-10 ${step.color}`} />
                    </div>
                    <div className="scoreboard-text text-lg text-muted-foreground">
                      STEP {step.step}
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow (except for last step) */}
              {index < steps.length - 1 && (
                <div className="lg:hidden flex justify-center">
                  <ArrowRight className="w-6 h-6 text-primary rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-lg text-muted-foreground mb-6">
              Join thousands of fantasy managers who trust SleeperSheets for dynasty, keeper, and regular league management.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-success">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              <span>Free to use • No account required • Instant setup</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;