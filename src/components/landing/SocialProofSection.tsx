import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Quote, Trophy, Shield, BarChart3 } from 'lucide-react';

const SocialProofSection: React.FC = () => {
  const testimonials = [
    {
      quote: "SleeperSheets completely transformed how we manage our 12-team dynasty league. The salary cap tracking is flawless and the trade simulator has saved us countless hours of manual calculations.",
      author: "Mike Chen",
      role: "League Commissioner",  
      league: "Dynasty Warriors League",
      rating: 5
    },
    {
      quote: "I use SleeperSheets for both my dynasty league and regular redraft leagues. The performance analytics help me see how I'm doing vs league averages, and the export features are perfect for our season recap.",
      author: "Sarah Johnson", 
      role: "Fantasy Manager",
      league: "Elite Fantasy Football", 
      rating: 5
    },
    {
      quote: "The data export features are incredible for our keeper league. We can generate detailed reports for our annual meeting and track multi-year performance trends perfectly.",
      author: "David Rodriguez",
      role: "League Treasurer", 
      league: "Championship Keeper League",
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
    <section className="py-16 sm:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Trust Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Built for <span className="gradient-text">Serious Managers</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            No clutter, no ad blocks, and no unnecessary noise. Just a focused experience for managing your league faster and better.
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

        {/* Testimonials Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              What Fantasy Managers Say
            </h3>
            <p className="text-lg text-muted-foreground">
              Real feedback from dynasty, keeper, and regular league commissioners and managers
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
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
