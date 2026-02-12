import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  FileText, 
  RefreshCw, 
  Shield, 
  BarChart3, 
  Download
} from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: DollarSign,
      title: 'Real-time Salary Tracking',
      description: 'See cap usage and available space instantly so every roster move stays compliant.',
      color: 'text-success'
    },
    {
      icon: FileText,
      title: 'Contract Management',
      description: 'Manage terms, years remaining, and dead-cap impact from one place.',
      color: 'text-primary'
    },
    {
      icon: RefreshCw,
      title: 'Trade Simulator',
      description: 'Model trade outcomes before you commit, including cap and roster effects.',
      color: 'text-secondary'
    },
    {
      icon: Shield,
      title: 'League Ownership Protection',
      description: 'Protect commissioner-level actions with ownership verification controls.',
      color: 'text-chart-3'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Use trend and comparison views to make faster weekly decisions.',
      color: 'text-chart-4'
    },
    {
      icon: Download,
      title: 'Data Export & Backup',
      description: 'Export clean reports for your league chat, docs, or offseason planning.',
      color: 'text-chart-5'
    }
  ];

  return (
    <section id="features-section" className="py-10 sm:py-14 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <span className="text-xs uppercase tracking-wide px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary">
            Salary + Contract Control
          </span>
          <span className="text-xs uppercase tracking-wide px-3 py-1 rounded-full border border-secondary/30 bg-secondary/10 text-secondary">
            Cleaner Weekly Workflow
          </span>
          <span className="text-xs uppercase tracking-wide px-3 py-1 rounded-full border border-success/30 bg-success/10 text-success">
            Better League Decisions
          </span>
        </div>

        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="font-sans normal-case tracking-tight text-2xl sm:text-3xl lg:text-4xl font-semibold mb-3">
            Core tools, without the clutter
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            Everything needed to run your league day-to-day, in a faster and cleaner workflow.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {features.map((feature, index) => (
            <Card key={index} className="glass-card hover-lift border-border/50 h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-background/50 border border-white/10">
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-base sm:text-lg leading-tight">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pb-5">
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
