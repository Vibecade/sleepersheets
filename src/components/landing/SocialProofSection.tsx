import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Users, Trophy, TrendingUp, Quote } from 'lucide-react';

const SocialProofSection: React.FC = () => {
  const features = [
    {
      icon: Users,
      title: 'League Management',
      description: 'Complete salary cap and roster management',
      color: 'text-primary'
    },
    {
      icon: Trophy,
      title: 'Contract Tracking',
      description: 'Multi-year contract management with dead cap',
      color: 'text-secondary'
    },
    {
      icon: TrendingUp,
      title: 'Trade Simulation',
      description: 'Advanced trade analyzer with salary impact',
      color: 'text-success'
    }
  ];

  const testimonials = [
    {
      quote: "SleeperSheets completely transformed how we manage our 12-team dynasty league. The salary cap tracking is flawless and the trade simulator has saved us countless hours of manual calculations.",
      author: "Mike Chen",
      role: "League Commissioner",
      league: "Dynasty Warriors League",
      rating: 5
    },
    {
      quote: "As someone who manages 3 different dynasty leagues, SleeperSheets is absolutely essential. The multi-league dashboard and contract management features are game-changers.",
      author: "Sarah Johnson", 
      role: "Dynasty Manager",
      league: "Elite Fantasy Football",
      rating: 5
    },
    {
      quote: "The data export features are incredible for our league. We can generate detailed salary reports for our annual meeting and everything is perfectly organized.",
      author: "David Rodriguez",
      role: "League Treasurer", 
      league: "Championship Dynasty League",
      rating: 5
    }
  ];

  const benefits = [
    "Start for Free with core features",
    "Secure data with league ownership protection", 
    "Real-time salary cap tracking",
    "Advanced contract management",
    "Comprehensive trade analysis",
    "Professional export capabilities"
  ];

  return (
    <section className="py-16 sm:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Features Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Built for <span className="gradient-text">Dynasty Champions</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Professional-grade tools designed for serious dynasty league management.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="glass-card p-8 text-center hover-lift">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-xl bg-background/50">
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                </div>
                <div className="text-xl font-bold mb-2">
                  {feature.title}
                </div>
                <div className="text-muted-foreground">
                  {feature.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              What Dynasty Managers Say
            </h3>
            <p className="text-lg text-muted-foreground">
              Real feedback from real dynasty league commissioners and managers
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="glass-card hover-lift h-full">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  
                  <div className="mb-6">
                    <Quote className="w-6 h-6 text-primary mb-3" />
                    <p className="text-muted-foreground leading-relaxed italic">
                      "{testimonial.quote}"
                    </p>
                  </div>

                  <div className="border-t border-border/50 pt-4">
                    <div className="font-semibold text-foreground">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {testimonial.league}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="glass-card p-8">
          <h3 className="text-2xl font-bold text-center mb-8">
            Why Choose <span className="text-primary">SleeperSheets</span>?
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-success rounded-full flex-shrink-0"></div>
                <span className="text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;