import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  FileText, 
  RefreshCw, 
  Shield, 
  BarChart3, 
  Download,
  Users,
  Target,
  Zap
} from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: DollarSign,
      title: 'Real-time Salary Tracking',
      description: 'Monitor your team salary cap usage with live updates. See exactly how much cap space you have left and plan your moves accordingly.',
      color: 'text-success'
    },
    {
      icon: FileText,
      title: 'Contract Management',
      description: 'Track player contracts, lengths, and dead cap implications. Never lose track of when contracts expire or their impact on your cap.',
      color: 'text-primary'
    },
    {
      icon: RefreshCw,
      title: 'Trade Simulator',
      description: 'Simulate trades before making them. See the exact salary cap impact and ensure trades fit within league rules.',
      color: 'text-secondary'
    },
    {
      icon: Shield,
      title: 'League Ownership Protection',
      description: 'Secure your league data with ownership verification. Only verified league commissioners can modify critical league settings.',
      color: 'text-chart-3'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Get insights into salary distribution, team trends, and league patterns. Make data-driven decisions for your dynasty.',
      color: 'text-chart-4'
    },
    {
      icon: Download,
      title: 'Data Export & Backup',
      description: 'Export your league data to CSV, Excel, or PDF formats. Keep permanent records and share reports with your league.',
      color: 'text-chart-5'
    },
    {
      icon: Users,
      title: 'Multi-League Management',
      description: 'Manage multiple dynasty leagues from one dashboard. Switch between leagues seamlessly and track all your teams.',
      color: 'text-success'
    },
    {
      icon: Target,
      title: 'Strategic Planning',
      description: 'Plan future moves with contract projections and cap space forecasting. Stay ahead of your competition.',
      color: 'text-primary'
    },
    {
      icon: Zap,
      title: 'Sleeper Integration',
      description: 'Direct integration with Sleeper API for automatic roster and transaction sync. No manual data entry required.',
      color: 'text-secondary'
    }
  ];

  return (
    <section className="py-16 sm:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Everything You Need to <span className="gradient-text">Dominate</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Professional-grade tools designed for serious dynasty league managers who want to gain every competitive advantage.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="glass-card hover-lift border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 rounded-lg bg-background/50">
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Highlight */}
        <div className="mt-16 text-center">
          <div className="glass-card p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              Built for <span className="text-primary">Dynasty Champions</span>
            </h3>
            <p className="text-lg text-muted-foreground">
              SleeperSheets was created by dynasty league managers, for dynasty league managers. 
              Every feature is designed to give you the edge you need to build a championship dynasty.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;